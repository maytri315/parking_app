# parking_app/backend/app.py

from flask import Flask, request, jsonify
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, get_jwt
from flask_mail import Mail, Message
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
from functools import wraps
import os

# Import from your modules
from .config import Config
from .models import db, User, ParkingLot, Booking
from .tasks import celery, send_booking_reminder_email, check_and_send_alerts # Import tasks

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize extensions
    db.init_app(app)
    jwt = JWTManager(app)
    mail = Mail(app)

    # Ensure database directory exists and create tables on app start
    with app.app_context():
        db_dir = os.path.dirname(Config.SQLALCHEMY_DATABASE_URI.replace('sqlite:///', ''))
        os.makedirs(db_dir, exist_ok=True)
        db.create_all()

        # Create a default admin user if one doesn't exist
        if not User.query.filter_by(username='admin').first():
            hashed_password = generate_password_hash('adminpassword') # Default admin password
            admin_user = User(username='admin', email='admin@example.com', password=hashed_password, role='admin')
            db.session.add(admin_user)
            db.session.commit()
            print("Default admin user created: username='admin', password='adminpassword'")
        
        # Create a default regular user if one doesn't exist
        if not User.query.filter_by(username='testuser').first():
            hashed_password = generate_password_hash('testpassword') # Default test user password
            test_user = User(username='testuser', email='test@example.com', password=hashed_password, role='user')
            db.session.add(test_user)
            db.session.commit()
            print("Default test user created: username='testuser', password='testpassword'")


    # --- JWT User Loader (required for Flask-JWT-Extended) ---
    # This tells Flask-JWT-Extended how to load a user object from the identity in the token
    @jwt.user_lookup_loader
    def user_lookup_callback(_jwt_header, jwt_data):
        identity = jwt_data["sub"] # 'sub' claim holds the identity (user.id in our case)
        return User.query.filter_by(id=identity).first()

    # --- Decorator for Admin Required Routes ---
    def admin_required():
        def wrapper(fn):
            @wraps(fn)
            @jwt_required() # Ensure JWT is present and valid
            def decorator(*args, **kwargs):
                claims = get_jwt() # Get all claims from the JWT
                if claims.get('role') == 'admin':
                    return fn(*args, **kwargs)
                else:
                    return jsonify({"message": "Admin access required"}), 403
            return decorator
        return wrapper

    # --- Cross-Origin Resource Sharing (CORS) ---
    # In a real application, use Flask-CORS for proper handling
    # For simplicity here, we'll manually add headers
    @app.after_request
    def add_cors_headers(response):
        response.headers['Access-Control-Allow-Origin'] = '*' # Allow all origins for development
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
        response.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE'
        return response

    # --- Authentication Routes ---
    @app.route('/api/register', methods=['POST'])
    def register():
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')

        if not all([username, email, password]):
            return jsonify({"message": "Missing username, email, or password"}), 400

        if User.query.filter_by(username=username).first():
            return jsonify({"message": "Username already exists"}), 409
        if User.query.filter_by(email=email).first():
            return jsonify({"message": "Email already exists"}), 409

        hashed_password = generate_password_hash(password)
        new_user = User(username=username, email=email, password=hashed_password, role='user')
        db.session.add(new_user)
        db.session.commit()
        return jsonify({"message": "User registered successfully"}), 201

    @app.route('/api/login', methods=['POST'])
    def login():
        data = request.get_json()
        username_or_email = data.get('username') # Changed key to match frontend sending 'username'
        password = data.get('password')

        # Try to find user by username or email
        user = User.query.filter(
            (User.username == username_or_email) |
            (User.email == username_or_email)
        ).first()

        if user and check_password_hash(user.password, password):
            # IMPORTANT: identity is user.id, and role/username in additional_claims
            access_token = create_access_token(
                identity=user.id,
                additional_claims={"role": user.role, "username": user.username}
            )
            user.last_login_date = datetime.utcnow() # Update last login timestamp
            db.session.commit()
            return jsonify(
                access_token=access_token,
                role=user.role,
                username=user.username # Also return username for convenience
            ), 200
        else:
            return jsonify({"message": "Invalid credentials"}), 401

    # --- Admin Routes ---
    @app.route('/api/users', methods=['GET'])
    @admin_required()
    def get_users():
        users = User.query.all()
        output = []
        for user in users:
            output.append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': user.role,
                'last_login_date': user.last_login_date.isoformat() if user.last_login_date else None
            })
        return jsonify(output), 200

    @app.route('/api/parking_lots', methods=['POST'])
    @admin_required()
    def create_parking_lot():
        data = request.get_json()
        name = data.get('prime_location_name')
        price = data.get('price')
        address = data.get('address')
        pin_code = data.get('pin_code')
        spots = data.get('number_of_spots')

        if not all([name, price, address, pin_code, spots is not None]):
            return jsonify({"message": "Missing data"}), 400
        if not isinstance(price, (int, float)) or price < 0:
            return jsonify({"message": "Price must be a non-negative number"}), 400
        if not isinstance(spots, int) or spots < 0:
            return jsonify({"message": "Number of spots must be a non-negative integer"}), 400

        new_lot = ParkingLot(
            prime_location_name=name,
            price=price,
            address=address,
            pin_code=pin_code,
            number_of_spots=spots,
            created_at=datetime.utcnow() # Set creation timestamp
        )
        db.session.add(new_lot)
        db.session.commit()
        return jsonify({"message": "Parking lot created successfully", "id": new_lot.id}), 201

    @app.route('/api/parking_lots/<int:lot_id>', methods=['PUT'])
    @admin_required()
    def update_parking_lot(lot_id):
        lot = ParkingLot.query.get(lot_id)
        if not lot:
            return jsonify({"message": "Parking lot not found"}), 404

        data = request.get_json()
        lot.prime_location_name = data.get('prime_location_name', lot.prime_location_name)
        lot.price = data.get('price', lot.price)
        lot.address = data.get('address', lot.address)
        lot.pin_code = data.get('pin_code', lot.pin_code)
        lot.number_of_spots = data.get('number_of_spots', lot.number_of_spots)
        db.session.commit()
        return jsonify({"message": "Parking lot updated successfully"}), 200

    @app.route('/api/parking_lots/<int:lot_id>', methods=['DELETE'])
    @admin_required()
    def delete_parking_lot(lot_id):
        lot = ParkingLot.query.get(lot_id)
        if not lot:
            return jsonify({"message": "Parking lot not found"}), 404
        db.session.delete(lot)
        db.session.commit()
        return jsonify({"message": "Parking lot deleted successfully"}), 200

    # --- User Routes & Common Routes (Parking Lots) ---
    @app.route('/api/parking_lots', methods=['GET'])
    @jwt_required() # Both admin and user can view lots
    def get_parking_lots():
        parking_lots = ParkingLot.query.all()
        output = []
        for lot in parking_lots:
            # Calculate available spots (simplified: subtract current bookings)
            booked_spots = Booking.query.filter(
                Booking.parking_lot_id == lot.id,
                Booking.end_time > datetime.utcnow(), # Active bookings
                Booking.start_time < datetime.utcnow() + timedelta(minutes=1), # Consider immediate future for simplicity
            ).count()
            output.append({
                'id': lot.id,
                'prime_location_name': lot.prime_location_name,
                'price': lot.price,
                'address': lot.address,
                'pin_code': lot.pin_code,
                'number_of_spots': lot.number_of_spots,
                'available_spots': lot.number_of_spots - booked_spots,
                'created_at': lot.created_at.isoformat()
            })
        return jsonify({"data": output}), 200

    @app.route('/api/book', methods=['POST'])
    @jwt_required()
    def book_parking_spot():
        data = request.get_json()
        user_id = get_jwt_identity() # This is user.id due to create_access_token setup
        parking_lot_id = data.get('parking_lot_id')
        start_time_str = data.get('start_time')
        end_time_str = data.get('end_time')

        if not all([parking_lot_id, start_time_str, end_time_str]):
            return jsonify({"message": "Missing booking details"}), 400

        try:
            # Assuming ISO format string from frontend
            start_time = datetime.fromisoformat(start_time_str.replace('Z', '+00:00'))
            end_time = datetime.fromisoformat(end_time_str.replace('Z', '+00:00'))
        except ValueError:
            return jsonify({"message": "Invalid date format. Use ISO format (YYYY-MM-DDTHH:MM:SSZ)."}), 400

        if start_time >= end_time:
            return jsonify({"message": "Start time must be before end time"}), 400
        if start_time < datetime.utcnow() - timedelta(minutes=1): # Allow a small buffer for current time
            return jsonify({"message": "Booking cannot be in the past"}), 400

        lot = ParkingLot.query.get(parking_lot_id)
        if not lot:
            return jsonify({"message": "Parking lot not found"}), 404

        # Check for available spots (simplified logic to prevent overbooking for a given lot at *any* overlapping time)
        # A more robust system would check for overlaps with existing bookings
        current_bookings_for_lot = Booking.query.filter(
            Booking.parking_lot_id == parking_lot_id,
            Booking.end_time > datetime.utcnow() # Only consider bookings that are still active or in future
        ).count()

        if current_bookings_for_lot >= lot.number_of_spots:
            return jsonify({"message": "No available spots at this lot for the selected time"}), 400

        new_booking = Booking(
            user_id=user_id,
            parking_lot_id=parking_lot_id,
            start_time=start_time,
            end_time=end_time
        )
        db.session.add(new_booking)
        db.session.commit()
        return jsonify({"message": "Parking spot booked successfully!", "booking_id": new_booking.id}), 201

    @app.route('/api/my_bookings', methods=['GET'])
    @jwt_required()
    def get_my_bookings():
        user_id = get_jwt_identity()
        bookings = Booking.query.filter_by(user_id=user_id).all()
        output = []
        for booking in bookings:
            lot = ParkingLot.query.get(booking.parking_lot_id)
            output.append({
                'id': booking.id,
                'parking_lot_name': lot.prime_location_name if lot else 'Unknown',
                'address': lot.address if lot else 'Unknown',
                'start_time': booking.start_time.isoformat(),
                'end_time': booking.end_time.isoformat(),
                'created_at': booking.created_at.isoformat()
            })
        return jsonify({"data": output}), 200

    @app.route('/api/user_dashboard', methods=['GET'])
    @jwt_required()
    def user_dashboard():
        current_user_identity = get_jwt_identity() # This is user.id
        current_user = User.query.filter_by(id=current_user_identity).first()

        if not current_user:
            return jsonify({"message": "User not found"}), 404

        user_info = {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "role": current_user.role,
        }
        return jsonify({"message": "User dashboard data", "user_info": user_info}), 200

    @app.route('/api/admin_dashboard', methods=['GET'])
    @admin_required() # Role check handled by decorator now
    def admin_dashboard():
        # current_user_identity = get_jwt_identity() # Not strictly needed if decorator handles
        # claims = get_jwt() # Not strictly needed if decorator handles role check

        total_users = User.query.count()
        total_parking_lots = ParkingLot.query.count()
        
        # Count current active bookings
        active_bookings_count = Booking.query.filter(Booking.end_time > datetime.utcnow()).count()

        return jsonify({
            "message": "Admin dashboard data",
            "total_users": total_users,
            "total_parking_lots": total_parking_lots,
            "active_bookings_count": active_bookings_count
        }), 200
    
    # --- Alert Endpoint for Frontend (Simplified) ---
    @app.route('/api/user_alert_status', methods=['GET'])
    @jwt_required()
    def get_user_alert_status():
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return jsonify({"alert_message": "User not found."}), 404

        alert_message = ""

        # Check if user has no bookings
        if not user.bookings:
            alert_message += "It looks like you haven't made any bookings yet! "

        # Check for newly created parking lots since user's last login
        time_threshold = user.last_login_date if user.last_login_date else datetime.min
        new_lots_since_last_login = ParkingLot.query.filter(
            ParkingLot.created_at > time_threshold
        ).count()

        if new_lots_since_last_login > 0:
            alert_message += f"There are {new_lots_since_last_login} new parking lot(s) available since your last visit. "

        if alert_message:
            alert_message += "Explore and book your spot now!"
            return jsonify({"alert_message": alert_message, "show_alert": True}), 200
        else:
            return jsonify({"alert_message": "", "show_alert": False}), 200


    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)