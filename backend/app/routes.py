from flask import request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app import db, bcrypt
from app.models import User, ParkingLot, ParkingSpot, Reservation
from datetime import datetime

def init_app(app):
    @app.route('/User/register', methods=['POST'])
    def register():
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        role = data.get('role', 'user')

        if User.query.filter_by(username=username).first() or User.query.filter_by(email=email).first():
            return jsonify({'message': 'Username or email already exists'}), 400

        user = User(username=username, email=email, role=role)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        return jsonify({'msg': 'User registered successfully'}), 201

    @app.route('/User/login', methods=['POST'])
    def login():
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        user = User.query.filter_by(username=username).first()

        if user and user.check_password(password):
            access_token = create_access_token(identity=user.id, additional_claims={'role': user.role, 'username': user.username})
            return jsonify({'access_token': access_token, 'username': user.username, 'user_role': user.role}), 200
        return jsonify({'message': 'Invalid credentials'}), 401

    @app.route('/parking_lots/available', methods=['GET'])
    @jwt_required()
    def available_lots():
        lots = ParkingLot.query.all()
        return jsonify([{
            'id': lot.id,
            'prime_location_name': lot.prime_location_name,
            'price': lot.price,
            'address': lot.address,
            'pin_code': lot.pin_code,
            'available_spots': sum(1 for spot in lot.spots if spot.status == 'A')
        } for lot in lots]), 200

    @app.route('/spots/<int:lot_id>', methods=['GET'])
    @jwt_required()
    def get_spots(lot_id):
        lot = ParkingLot.query.get_or_404(lot_id)
        return jsonify([{
            'id': spot.id,
            'status': spot.status
        } for spot in lot.spots]), 200

    @app.route('/reserve', methods=['POST'])
    @jwt_required()
    def reserve():
        data = request.get_json()
        spot_id = data.get('spot_id')
        vehicle_no = data.get('vehicle_no')
        user_id = get_jwt_identity()

        spot = ParkingSpot.query.get_or_404(spot_id)
        if spot.status != 'A':
            return jsonify({'message': 'Spot not available'}), 400

        lot = spot.lot
        reservation = Reservation(
            spot_id=spot_id,
            user_id=user_id,
            parking_timestamp=datetime.utcnow(),
            parking_cost=lot.price
        )
        spot.status = 'O'
        db.session.add(reservation)
        db.session.commit()
        return jsonify({'message': 'Spot reserved', 'reservation_id': reservation.id}), 201

    @app.route('/reservations', methods=['GET'])
    @jwt_required()
    def get_reservations():
        user_id = get_jwt_identity()
        reservations = Reservation.query.filter_by(user_id=user_id).all()
        return jsonify([{
            'id': r.id,
            'spot_id': r.spot_id,
            'vehicle_no': r.vehicle_no,
            'parking_timestamp': r.parking_timestamp.isoformat(),
            'leaving_timestamp': r.leaving_timestamp.isoformat() if r.leaving_timestamp else None,
            'parking_cost': r.parking_cost
        } for r in reservations]), 200

    @app.route('/release/<int:reservation_id>', methods=['POST'])
    @jwt_required()
    def release(reservation_id):
        user_id = get_jwt_identity()
        reservation = Reservation.query.filter_by(id=reservation_id, user_id=user_id).first_or_404()
        if reservation.leaving_timestamp:
            return jsonify({'message': 'Reservation already released'}), 400

        reservation.leaving_timestamp = datetime.utcnow()
        reservation.spot.status = 'A'
        db.session.commit()
        return jsonify({'message': 'Reservation released'}), 200

    @app.route('/api/parking_lots', methods=['GET', 'POST'])
    @jwt_required()
    def manage_lots():
        if get_jwt_identity_role() != 'admin':
            return jsonify({'message': 'Admin access required'}), 403

        if request.method == 'POST':
            data = request.get_json()
            lot = ParkingLot(
                prime_location_name=data['prime_location_name'],
                price=data['price'],
                address=data['address'],
                pin_code=data['pin_code'],
                number_of_spots=data['number_of_spots']
            )
            db.session.add(lot)
            db.session.commit()
            for _ in range(lot.number_of_spots):
                spot = ParkingSpot(lot_id=lot.id, status='A')
                db.session.add(spot)
            db.session.commit()
            return jsonify({'message': 'Parking lot created'}), 201
        else:
            lots = ParkingLot.query.all()
            return jsonify([{
                'id': lot.id,
                'prime_location_name': lot.prime_location_name,
                'price': lot.price,
                'address': lot.address,
                'pin_code': lot.pin_code,
                'number_of_spots': lot.number_of_spots
            } for lot in lots]), 200

    @app.route('/api/parking_lots/<int:id>', methods=['PUT', 'DELETE'])
    @jwt_required()
    def update_delete_lot(id):
        if get_jwt_identity_role() != 'admin':
            return jsonify({'message': 'Admin access required'}), 403

        lot = ParkingLot.query.get_or_404(id)
        if request.method == 'PUT':
            data = request.get_json()
            lot.prime_location_name = data['prime_location_name']
            lot.price = data['price']
            lot.address = data['address']
            lot.pin_code = data['pin_code']
            lot.number_of_spots = data['number_of_spots']
            db.session.commit()
            return jsonify({'message': 'Parking lot updated'}), 200
        else:
            db.session.delete(lot)
            db.session.commit()
            return jsonify({'message': 'Parking lot deleted'}), 200

    @app.route('/api/spots/<int:lot_id>', methods=['GET'])
    @jwt_required()
    def admin_get_spots(lot_id):
        if get_jwt_identity_role() != 'admin':
            return jsonify({'message': 'Admin access required'}), 403
        lot = ParkingLot.query.get_or_404(lot_id)
        return jsonify([{
            'id': spot.id,
            'status': spot.status,
            'reservations': [{'user_id': r.user_id} for r in spot.reservations]
        } for spot in lot.spots]), 200

    @app.route('/api/users', methods=['GET'])
    @jwt_required()
    def get_users():
        if get_jwt_identity_role() != 'admin':
            return jsonify({'message': 'Admin access required'}), 403
        users = User.query.all()
        return jsonify([{
            'id': user.id,
            'username': user.username,
            'email': user.email
        } for user in users]), 200

    @app.route('/admin/edit_lot/<int:id>', methods=['POST'])
    @jwt_required()
    def admin_edit_lot(id):
        if get_jwt_identity_role() != 'admin':
            return jsonify({'message': 'Admin access required'}), 403
        data = request.form
        lot = ParkingLot.query.get_or_404(id)
        lot.prime_location_name = data['location_name']
        lot.price = float(data['price'])
        lot.address = data['address']
        lot.pin_code = data['pin_code']
        new_spots = int(data['maximum_number_of_spots'])
        current_spots = len(lot.spots)
        if new_spots > current_spots:
            for _ in range(new_spots - current_spots):
                spot = ParkingSpot(lot_id=lot.id, status='A')
                db.session.add(spot)
        elif new_spots < current_spots:
            spots_to_remove = lot.spots[new_spots:]
            for spot in spots_to_remove:
                db.session.delete(spot)
        db.session.commit()
        return jsonify({'message': 'Parking lot updated'}), 200

    @app.route('/admin/delete_spot/<int:id>', methods=['POST'])
    @jwt_required()
    def delete_spot(id):
        if get_jwt_identity_role() != 'admin':
            return jsonify({'message': 'Admin access required'}), 403
        spot = ParkingSpot.query.get_or_404(id)
        db.session.delete(spot)
        db.session.commit()
        return jsonify({'message': 'Spot deleted'}), 200

def get_jwt_identity_role():
    claims = get_jwt()
    return claims['role']

def init_admin(app):
    pass  # Placeholder for admin initialization if needed