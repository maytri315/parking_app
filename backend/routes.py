from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, create_access_token, get_jwt_identity
import json # Added for safe JSON serialization/deserialization with Redis
import redis
from datetime import datetime, timedelta # Added timedelta for potential future use
from flask import render_template
from flask import Flask
from flask_cors import CORS
from flask_cors import cross_origin




# Assuming 'db' is initialized in your main app.py and imported here correctly
# If 'db' is defined in models.py, then you might need to adjust this.
# A common pattern is to initialize db in app.py and pass it to blueprints or make it globally accessible after init.
from . import db # Corrected import for db, assuming app.py is in the same package level

# Corrected import for models
from .models import User, ParkingLot, ParkingSpot, Reservation
from .tasks import daily_reminder, export_csv, monthly_report

app = Flask(__name__)
CORS(app)

api = Blueprint('api', __name__)

@api.route('/')
def index():
    return render_template('index.html')



@api.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    email = data.get('email')

    if not username or not password or not email:
        return jsonify({"message": "Username, password, and email are required"}), 400

    if User.query.filter_by(username=username).first() or User.query.filter_by(email=email).first():
        return jsonify({"message": "User already exists with that username or email"}), 400
    
    # Default role to 'user' for new registrations
    user = User(username=username, email=email, role='user') 
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return jsonify({"message": "User registered successfully"}), 201

@api.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"message": "Username and password are required"}), 400

    user = User.query.filter_by(username=username).first()
    if user and user.check_password(password):
        # Store user's role and username in the JWT identity
        access_token = create_access_token(identity={'username': user.username, 'role': user.role})
        return jsonify({"access_token": access_token, "user_role": user.role, "username": user.username}), 200
    return jsonify({"message": "Invalid credentials"}), 401

@api.route('/parking_lots', methods=['GET', 'POST'])
@jwt_required()
def parking_lots():
    # It's good practice to handle Redis connection errors gracefully
    try:
        r = redis.Redis.from_url('redis://localhost:6379/0', decode_responses=True) # decode_responses=True for strings
    except redis.exceptions.ConnectionError:
        print("Could not connect to Redis. Proceeding without cache.")
        r = None # Set Redis to None to skip caching operations

    cache_key = 'parking_lots'
    
    if request.method == 'GET':
        if r:
            cached = r.get(cache_key)
            if cached:
                # Safely deserialize JSON from Redis
                return jsonify({"source": "cache", "data": json.loads(cached)}), 200
        
        lots = ParkingLot.query.all()
        data = []
        for lot in lots:
            # Also fetch available spots count for each lot
            available_spots = ParkingSpot.query.filter_by(parking_lot_id=lot.id, status='A').count()
            data.append({
                "id": lot.id,
                "prime_location_name": lot.prime_location_name,
                "price": float(lot.price), # Ensure price is float
                "address": lot.address,
                "pin_code": lot.pin_code,
                "number_of_spots": lot.number_of_spots,
                "available_spots": available_spots # Added available spots count
            })
        
        if r:
            # Safely serialize data to JSON string for Redis
            r.setex(cache_key, 300, json.dumps(data))
        return jsonify({"source": "db", "data": data}), 200
    
    else: # POST request to create a new parking lot
        identity = get_jwt_identity()
        if identity['role'] != 'admin':
            return jsonify({"message": "Admin access required"}), 403
        
        data = request.get_json()
        required_fields = ['prime_location_name', 'price', 'address', 'pin_code', 'number_of_spots']
        if not all(field in data for field in required_fields):
            return jsonify({"message": "Missing required parking lot data"}), 400
        
        try:
            lot = ParkingLot(
                prime_location_name=data['prime_location_name'],
                price=float(data['price']),
                address=data['address'],
                pin_code=data['pin_code'],
                number_of_spots=int(data['number_of_spots'])
            )
            db.session.add(lot)
            db.session.commit()

            # Create individual spots for the new lot
            for i in range(lot.number_of_spots):
                spot = ParkingSpot(parking_lot_id=lot.id, status='A')
                db.session.add(spot)
            db.session.commit()
            
            if r:
                r.delete(cache_key) # Invalidate parking_lots cache
            return jsonify({"message": "Parking lot created successfully", "lot_id": lot.id}), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({"message": f"Error creating parking lot: {str(e)}"}), 500

@api.route('/parking_lots/<int:id>', methods=['GET', 'PUT', 'DELETE']) # Added GET for single lot
@jwt_required()
def parking_lot_by_id(id):
    identity = get_jwt_identity()
    # It's good practice to handle Redis connection errors gracefully
    try:
        r = redis.Redis.from_url('redis://localhost:6379/0', decode_responses=True)
    except redis.exceptions.ConnectionError:
        print("Could not connect to Redis. Proceeding without cache.")
        r = None

    cache_key_lot = f'parking_lot_{id}'
    cache_key_lots_all = 'parking_lots' # To invalidate the all lots cache

    if request.method == 'GET':
        if r:
            cached = r.get(cache_key_lot)
            if cached:
                return jsonify({"source": "cache", "data": json.loads(cached)}), 200
        
        lot = ParkingLot.query.get_or_404(id)
        data = {
            "id": lot.id,
            "prime_location_name": lot.prime_location_name,
            "price": float(lot.price),
            "address": lot.address,
            "pin_code": lot.pin_code,
            "number_of_spots": lot.number_of_spots
        }
        if r:
            r.setex(cache_key_lot, 300, json.dumps(data))
        return jsonify({"source": "db", "data": data}), 200

    if identity['role'] != 'admin':
        return jsonify({"message": "Admin access required"}), 403
    
    lot = ParkingLot.query.get_or_404(id)

    if request.method == 'PUT':
        data = request.get_json()
        # Basic validation for update fields
        if 'prime_location_name' in data: lot.prime_location_name = data['prime_location_name']
        if 'price' in data: lot.price = float(data['price'])
        if 'address' in data: lot.address = data['address']
        if 'pin_code' in data: lot.pin_code = data['pin_code']
        
        # Handle change in number_of_spots - careful logic needed for adding/removing spots
        if 'number_of_spots' in data and int(data['number_of_spots']) != lot.number_of_spots:
            new_spot_count = int(data['number_of_spots'])
            current_spots = ParkingSpot.query.filter_by(parking_lot_id=lot.id).all()
            current_occupied_spots = sum(1 for spot in current_spots if spot.status == 'O')

            if new_spot_count < current_occupied_spots:
                 return jsonify({"message": "Cannot reduce number of spots below currently occupied spots"}), 400
            
            # If reducing spots, delete available ones first
            if new_spot_count < lot.number_of_spots:
                spots_to_remove = lot.number_of_spots - new_spot_count
                available_spots_to_remove = ParkingSpot.query.filter_by(parking_lot_id=lot.id, status='A').limit(spots_to_remove).all()
                for spot in available_spots_to_remove:
                    db.session.delete(spot)
            # If increasing spots, add new ones
            elif new_spot_count > lot.number_of_spots:
                spots_to_add = new_spot_count - lot.number_of_spots
                for _ in range(spots_to_add):
                    spot = ParkingSpot(parking_lot_id=lot.id, status='A')
                    db.session.add(spot)
            
            lot.number_of_spots = new_spot_count # Update lot's total spot count
        
        db.session.commit()
        if r:
            r.delete(cache_key_lot) # Invalidate single lot cache
            r.delete(cache_key_lots_all) # Invalidate all lots cache
        return jsonify({"message": "Parking lot updated successfully"}), 200
    
    else: # DELETE request
        spots = ParkingSpot.query.filter_by(parking_lot_id=id).all()
        if any(spot.status == 'O' for spot in spots):
            return jsonify({"message": "Cannot delete lot with occupied spots"}), 400
        
        # Delete all spots associated with this lot first
        for spot in spots:
            db.session.delete(spot)

        db.session.delete(lot)
        db.session.commit()
        if r:
            r.delete(cache_key_lot) # Invalidate single lot cache
            r.delete(cache_key_lots_all) # Invalidate all lots cache
            r.delete(f'spots_{id}') # Invalidate spots cache for this lot
        return jsonify({"message": "Parking lot and associated spots deleted successfully"}), 200

@api.route('/spots/<int:lot_id>', methods=['GET'])
@jwt_required()
def spots_by_lot(lot_id):
    # It's good practice to handle Redis connection errors gracefully
    try:
        r = redis.Redis.from_url('redis://localhost:6379/0', decode_responses=True)
    except redis.exceptions.ConnectionError:
        print("Could not connect to Redis. Proceeding without cache.")
        r = None

    cache_key = f'spots_{lot_id}'
    if r:
        cached = r.get(cache_key)
        if cached:
            return jsonify({"source": "cache", "data": json.loads(cached)}), 200
    
    # Ensure the lot exists
    parking_lot = ParkingLot.query.get(lot_id)
    if not parking_lot:
        return jsonify({"message": "Parking lot not found"}), 404

    spots = ParkingSpot.query.filter_by(parking_lot_id=lot_id).all()
    data = [{
        "id": spot.id, 
        "parking_lot_id": spot.parking_lot_id, 
        "status": spot.status
    } for spot in spots]
    
    if r:
        r.setex(cache_key, 300, json.dumps(data))
    return jsonify({"source": "db", "data": data}), 200

# New endpoint to get a single spot by ID, useful for booking confirmation page
@api.route('/spot/<int:spot_id>', methods=['GET'])
@jwt_required()
def get_single_spot(spot_id):
    spot = ParkingSpot.query.get_or_404(spot_id)
    lot = ParkingLot.query.get(spot.parking_lot_id)
    if not lot:
        return jsonify({"message": "Associated parking lot not found"}), 404
    
    return jsonify({
        "id": spot.id,
        "parking_lot_id": spot.parking_lot_id,
        "status": spot.status,
        "lot_details": {
            "id": lot.id,
            "prime_location_name": lot.prime_location_name,
            "price": float(lot.price),
            "address": lot.address,
            "pin_code": lot.pin_code
        }
    }), 200


@api.route('/reserve', methods=['POST'])
@jwt_required()
def reserve_spot(): # Renamed function to avoid conflict/be clearer
    identity = get_jwt_identity()
    user = User.query.filter_by(username=identity['username']).first()
    if not user:
        return jsonify({"message": "User not found"}), 404 # Should not happen with valid token

    data = request.get_json()
    spot_id = data.get('spot_id')
    vehicle_no = data.get('vehicle_no')
    # Assuming 'hours' is part of the request data for estimated duration/cost calculation on booking
    # Or you can calculate cost based on price_per_hour at release
    estimated_hours = data.get('hours', 1.0) # Default to 1 hour if not provided

    if not spot_id or not vehicle_no:
        return jsonify({"message": "Spot ID and Vehicle Number are required"}), 400

    spot = ParkingSpot.query.get(spot_id)
    if not spot or spot.status != 'A':
        return jsonify({"message": "Spot not found or not available"}), 400
    
    lot = ParkingLot.query.get(spot.parking_lot_id)
    if not lot:
        return jsonify({"message": "Associated parking lot not found"}), 404

    # The `parking_cost` should ideally be calculated at release based on duration
    # Let's store price_per_hour at booking time if cost is determined at release
    # For now, if parking_cost is meant to be an estimated upfront cost, keep it.
    # Assuming parking_cost in model is for final cost, so let's adjust model/logic
    # For simplicity, if parking_cost is for final cost, set to None at booking.
    # If parking_cost is per_hour rate, rename the field in model and here.
    
    # For now, based on your original code's intent for reservation.parking_cost:
    # If `parking_cost` in your model means `price_per_hour` for calculation later:
    reservation = Reservation(
        user_id=user.id,
        spot_id=spot.id,
        vehicle_no=vehicle_no, # Added vehicle_no
        parking_timestamp=datetime.utcnow(),
        price_per_hour=lot.price # Store the price per hour at time of booking
    )
    # If your Reservation model only has `parking_cost` for final cost, you might set it to None initially
    # reservation = Reservation(user_id=user.id, spot_id=spot.id, vehicle_no=vehicle_no, parking_timestamp=datetime.utcnow(), parking_cost=None)

    spot.status = 'O' # Mark spot as Occupied
    db.session.add(reservation)
    db.session.commit()
    
    try:
        r = redis.Redis.from_url('redis://localhost:6379/0')
        r.delete(f'spots_{lot.id}') # Invalidate spots cache for this lot
        r.delete('parking_lots') # Invalidate general parking lots cache
    except redis.exceptions.ConnectionError:
        print("Redis connection failed, cache not invalidated.")

    # Schedule reminder: e.g., 1 hour before estimated leaving time
    # This requires 'estimated_leaving_time' from frontend or calculated from 'hours'
    # For now, keeping your original reminder logic, but it seems fixed time.
    # Better: send_reminder.apply_async(args=[user.id, reservation.id], countdown=(estimated_hours * 3600 - X)) for X mins before.
    # Or, if it's an end-of-day reminder:
    # For Lucknow IST (UTC+5:30), 18:00 UTC is 23:30 IST. Adjust 'eta' if reminder needed in local time.
    daily_reminder.apply_async(args=[user.id, reservation.id], eta=datetime.utcnow().replace(hour=18, minute=0, second=0))

    return jsonify({"message": "Spot reserved successfully", "reservation_id": reservation.id}), 200

@api.route('/release/<int:reservation_id>', methods=['POST'])
@jwt_required()
def release_spot(reservation_id): # Renamed function
    identity = get_jwt_identity()
    user = User.query.filter_by(username=identity['username']).first()
    if not user:
        return jsonify({"message": "User not found"}), 404 # Should not happen

    # Ensure the user is releasing their own reservation
    reservation = Reservation.query.filter_by(id=reservation_id, user_id=user.id).first()
    if not reservation:
        return jsonify({"message": "Reservation not found or does not belong to user"}), 404
    
    if reservation.leaving_timestamp:
        return jsonify({"message": "Spot already released"}), 400

    reservation.leaving_timestamp = datetime.utcnow()
    
    # Calculate final cost based on duration
    duration_seconds = (reservation.leaving_timestamp - reservation.parking_timestamp).total_seconds()
    actual_hours = duration_seconds / 3600.0
    
    # Assuming `price_per_hour` is now stored on the reservation or fetched from the lot
    # If your model `Reservation` has `parking_cost` for final cost and `price_per_hour` for rate:
    lot_price_per_hour = reservation.price_per_hour if hasattr(reservation, 'price_per_hour') else reservation.spot.lot.price
    final_cost = actual_hours * lot_price_per_hour
    reservation.parking_cost = final_cost # Store the calculated final cost

    spot = ParkingSpot.query.get(reservation.spot_id)
    if spot: # Ensure spot exists before updating
        spot.status = 'A' # Mark spot as Available
    
    db.session.commit()
    
    try:
        r = redis.Redis.from_url('redis://localhost:6379/0')
        if spot:
            r.delete(f'spots_{spot.parking_lot_id}') # Invalidate spot cache
        r.delete('parking_lots') # Invalidate general parking lots cache
    except redis.exceptions.ConnectionError:
        print("Redis connection failed, cache not invalidated.")
    
    return jsonify({
        "message": "Spot released successfully",
        "reservation_id": reservation.id,
        "actual_hours": round(actual_hours, 2),
        "final_cost": round(final_cost, 2)
    }), 200

@api.route('/reservations', methods=['GET'])
@jwt_required()
def get_user_reservations(): # Renamed function
    identity = get_jwt_identity()
    user = User.query.filter_by(username=identity['username']).first()
    if not user:
        return jsonify({"message": "User not found"}), 404

    reservations = Reservation.query.filter_by(user_id=user.id).order_by(Reservation.parking_timestamp.desc()).all()
    
    data = []
    for r in reservations:
        spot_details = None
        lot_details = None
        if r.spot:
            spot_details = {"id": r.spot.id, "status": r.spot.status}
            if r.spot.lot:
                lot_details = {
                    "id": r.spot.lot.id,
                    "prime_location_name": r.spot.lot.prime_location_name,
                    "price": float(r.spot.lot.price)
                }

        data.append({
            "id": r.id,
            "spot_id": r.spot_id,
            "vehicle_no": r.vehicle_no, # Include vehicle number
            "parking_timestamp": r.parking_timestamp.isoformat(),
            "leaving_timestamp": r.leaving_timestamp.isoformat() if r.leaving_timestamp else None,
            "parking_cost": float(r.parking_cost) if r.parking_cost is not None else None, # Final cost
            "price_per_hour": float(r.price_per_hour) if hasattr(r, 'price_per_hour') and r.price_per_hour is not None else (float(r.spot.lot.price) if r.spot and r.spot.lot else None), # Price per hour at booking
            "spot": spot_details,
            "lot": lot_details
        })
    return jsonify({"reservations": data}), 200 # Return as an object with 'reservations' key

@api.route('/export_csv', methods=['POST'])
@jwt_required()
def export_csv_route(): # Renamed function
    identity = get_jwt_identity()
    user = User.query.filter_by(username=identity['username']).first()
    if not user:
        return jsonify({"message": "User not found"}), 404

    # Celery task should handle file creation and potentially sending email
    export_csv.delay(user.id, user.email)
    return jsonify({"message": "Export job started, you will receive an email shortly"}), 202

@api.route('/users', methods=['GET'])
@jwt_required()
def get_all_users(): # Renamed function
    identity = get_jwt_identity()
    if identity['role'] != 'admin':
        return jsonify({"message": "Admin access required"}), 403
    
    users = User.query.all()
    data = [{
        "id": u.id, 
        "username": u.username, 
        "email": u.email, 
        "role": u.role,
        "is_active": u.is_active # Assuming you have an 'is_active' field for blocking/unblocking
    } for u in users]
    return jsonify({"users": data}), 200

# New Admin route for blocking/unblocking users
@api.route('/users/<int:user_id>/status', methods=['PUT'])
@jwt_required()
def update_user_status(user_id):
    identity = get_jwt_identity()
    if identity['role'] != 'admin':
        return jsonify({"message": "Admin access required"}), 403
    
    user_to_update = User.query.get_or_404(user_id)
    if user_to_update.role == 'admin' and user_to_update.id != identity['user_id']: # Prevent admin from blocking self or other admins easily
        return jsonify({"message": "Cannot modify another admin's status directly"}), 403 # Add a more robust check based on your User model and identity structure

    data = request.get_json()
    if 'is_active' not in data or not isinstance(data['is_active'], bool):
        return jsonify({"message": "Invalid 'is_active' status provided"}), 400
    
    user_to_update.is_active = data['is_active']
    db.session.commit()
    return jsonify({"message": f"User {user_to_update.username} status updated to {'active' if user_to_update.is_active else 'inactive'}"}), 200

# Admin route for monthly report generation
@api.route('/admin/monthly_report', methods=['POST'])
@jwt_required()
def generate_monthly_report():
    identity = get_jwt_identity()
    if identity['role'] != 'admin':
        return jsonify({"message": "Admin access required"}), 403
    
    # You might want to pass month/year from the request or calculate server-side
    # For now, assuming it generates for the previous month
    # This also needs to be implemented in tasks.py
    monthly_report.delay() 
    return jsonify({"message": "Monthly report generation started"}), 202

# New route for getting available parking lots (for user booking flow)
@api.route('/parking_lots/available', methods=['GET'])
@jwt_required()
def get_available_parking_lots():
    # It's good practice to handle Redis connection errors gracefully
    try:
        r = redis.Redis.from_url('redis://localhost:6379/0', decode_responses=True)
    except redis.exceptions.ConnectionError:
        print("Could not connect to Redis. Proceeding without cache.")
        r = None

    cache_key = 'available_parking_lots'
    if r:
        cached = r.get(cache_key)
        if cached:
            return jsonify({"source": "cache", "data": json.loads(cached)}), 200
    
    available_lots_data = []
    lots = ParkingLot.query.all()
    for lot in lots:
        available_spots_count = ParkingSpot.query.filter_by(parking_lot_id=lot.id, status='A').count()
        if available_spots_count > 0:
            available_lots_data.append({
                "id": lot.id,
                "prime_location_name": lot.prime_location_name,
                "price": float(lot.price),
                "address": lot.address,
                "available_spots": available_spots_count
            })
    
    if r:
        r.setex(cache_key, 60, json.dumps(available_lots_data)) # Cache for a shorter duration
    return jsonify({"source": "db", "data": available_lots_data}), 200

# New endpoint for User Dashboard data (combines recent history, summaries)
@api.route('/user/dashboard_data', methods=['GET'])
@jwt_required()
def user_dashboard_data():
    identity = get_jwt_identity()
    user = User.query.filter_by(username=identity['username']).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Fetch all reservations for the user
    all_reservations = Reservation.query.filter_by(user_id=user.id).order_by(Reservation.parking_timestamp.desc()).all()

    # Prepare data for "Recent Parking History" (e.g., last 5-10 reservations)
    recent_history = all_reservations[:10] # Take the 10 most recent

    # Prepare data for "Reservation Status Overview" chart
    active_count = sum(1 for r in all_reservations if not r.leaving_timestamp)
    released_count = sum(1 for r in all_reservations if r.leaving_timestamp)

    reservation_status_chart_data = {
        "labels": ["Active Reservations", "Released Reservations"],
        "datasets": [{
            "data": [active_count, released_count],
            "backgroundColor": ["#ffc107", "#28a745"], # Warning for active, Success for released
            "hoverOffset": 4
        }]
    }

    # Prepare data for "Total Cost Incurred"
    total_cost_incurred = sum(r.parking_cost for r in all_reservations if r.parking_cost is not None)

    # Serialize reservations for recent history
    serialized_recent_history = []
    for r in recent_history:
        spot_details = None
        lot_details = None
        if r.spot:
            spot_details = {"id": r.spot.id, "status": r.spot.status}
            if r.spot.lot:
                lot_details = {
                    "id": r.spot.lot.id,
                    "prime_location_name": r.spot.lot.prime_location_name,
                    "price": float(r.spot.lot.price)
                }
        
        duration_td = None
        actual_hours = None
        if r.parking_timestamp and r.leaving_timestamp:
            duration_td = r.leaving_timestamp - r.parking_timestamp
            actual_hours = duration_td.total_seconds() / 3600.0

        serialized_recent_history.append({
            "id": r.id,
            "spot_id": r.spot_id,
            "vehicle_no": r.vehicle_no,
            "parking_timestamp": r.parking_timestamp.isoformat(),
            "leaving_timestamp": r.leaving_timestamp.isoformat() if r.leaving_timestamp else None,
            "parking_cost": float(r.parking_cost) if r.parking_cost is not None else None,
            "spot": spot_details,
            "lot": lot_details,
            "actual_hours": round(actual_hours, 1) if actual_hours is not None else None
        })

    return jsonify({
        "user_email": user.email,
        "recent_history": serialized_recent_history,
        "user_reservation_chart_data": reservation_status_chart_data,
        "total_cost_incurred": float(total_cost_incurred)
    }), 200

# New endpoint for Admin Dashboard summary data (similar to user, but for all users)
@api.route('/admin/dashboard_data', methods=['GET'])
@jwt_required()
def admin_dashboard_data():
    identity = get_jwt_identity()
    if identity['role'] != 'admin':
        return jsonify({"message": "Admin access required"}), 403

    all_reservations = Reservation.query.all()
    all_users = User.query.all()
    all_lots = ParkingLot.query.all()

    # Total Reservations & Costs
    total_reservations_count = len(all_reservations)
    total_revenue = sum(r.parking_cost for r in all_reservations if r.parking_cost is not None)

    # Reservation Status Chart (Active vs Released for all)
    admin_active_reservations = sum(1 for r in all_reservations if not r.leaving_timestamp)
    admin_released_reservations = sum(1 for r in all_reservations if r.leaving_timestamp)
    admin_reservation_status_chart_data = {
        "labels": ["Active Reservations", "Released Reservations"],
        "datasets": [{
            "data": [admin_active_reservations, admin_released_reservations],
            "backgroundColor": ["#ffc107", "#28a745"],
            "hoverOffset": 4
        }]
    }

    # Users by Role Chart
    user_count = sum(1 for u in all_users if u.role == 'user')
    admin_count = sum(1 for u in all_users if u.role == 'admin')
    user_roles_chart_data = {
        "labels": ["Users", "Admins"],
        "datasets": [{
            "data": [user_count, admin_count],
            "backgroundColor": ["#007bff", "#6c757d"], # Primary for users, Secondary for admins
            "hoverOffset": 4
        }]
    }

    # Parking Lot Occupancy (Example chart)
    lot_occupancy_labels = []
    lot_occupancy_data = []
    lot_occupancy_background_colors = []
    for lot in all_lots:
        occupied_spots = ParkingSpot.query.filter_by(parking_lot_id=lot.id, status='O').count()
        total_spots = lot.number_of_spots
        
        lot_occupancy_labels.append(f"{lot.prime_location_name} (Occupied: {occupied_spots}/{total_spots})")
        lot_occupancy_data.append(occupied_spots)
        
        # Color based on occupancy level
        if total_spots > 0:
            occupancy_ratio = occupied_spots / total_spots
            if occupancy_ratio >= 0.8:
                lot_occupancy_background_colors.append('#dc3545') # Red, highly occupied
            elif occupancy_ratio >= 0.5:
                lot_occupancy_background_colors.append('#ffc107') # Yellow, moderately occupied
            else:
                lot_occupancy_background_colors.append('#28a745') # Green, low occupied
        else:
            lot_occupancy_background_colors.append('#6c757d') # Gray if no spots

    parking_lot_occupancy_chart_data = {
        "labels": lot_occupancy_labels,
        "datasets": [{
            "label": "Occupied Spots",
            "data": lot_occupancy_data,
            "backgroundColor": lot_occupancy_background_colors,
            "borderWidth": 1
        }]
    }

    return jsonify({
        "total_reservations_count": total_reservations_count,
        "total_revenue": float(total_revenue),
        "admin_reservation_status_chart_data": admin_reservation_status_chart_data,
        "user_roles_chart_data": user_roles_chart_data,
        "parking_lot_occupancy_chart_data": parking_lot_occupancy_chart_data,
        "total_users": len(all_users),
        "total_parking_lots": len(all_lots)
    }), 200

# Consider adding Admin views for detailed listings of Reservations and Spots too, similar to /users