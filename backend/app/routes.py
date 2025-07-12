from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from .models import db, User, ParkingLot, ParkingSpot, Reservation
from redis import Redis
from .tasks import export_csv
import json
from datetime import datetime

api = Blueprint('api', __name__)
redis_client = Redis.from_url('redis://localhost:6379/0')

def init_admin():
    if not User.query.filter_by(role='admin').first():
        admin = User(username='admin', password='admin123', role='admin', email='admin@example.com')
        db.session.add(admin)
        db.session.commit()

@api.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    email = data.get('email')
    if User.query.filter_by(username=username).first() or User.query.filter_by(email=email).first():
        return jsonify({'message': 'User already exists'}), 400
    user = User(username=username, password=password, role='user', email=email)
    db.session.add(user)
    db.session.commit()
    return jsonify({'message': 'User registered successfully'}), 201

@api.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    user = User.query.filter_by(username=username, password=password).first()
    if not user:
        return jsonify({'message': 'Invalid credentials'}), 401
    access_token = create_access_token(identity=user.id, additional_claims={'role': user.role})
    return jsonify({'access_token': access_token}), 200

@api.route('/parking_lots', methods=['GET', 'POST'])
@jwt_required()
def parking_lots():
    identity = get_jwt_identity()
    user = User.query.get(identity)
    if request.method == 'POST':
        if user.role != 'admin':
            return jsonify({'message': 'Admin access required'}), 403
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
        for _ in range(data['number_of_spots']):
            spot = ParkingSpot(lot_id=lot.id)
            db.session.add(spot)
        db.session.commit()
        redis_client.delete('parking_lots')
        return jsonify({'message': 'Parking lot created'}), 201
    cached = redis_client.get('parking_lots')
    if cached:
        return jsonify(json.loads(cached)), 200
    lots = ParkingLot.query.all()
    result = [{'id': lot.id, 'prime_location_name': lot.prime_location_name, 'price': lot.price, 'address': lot.address, 'pin_code': lot.pin_code, 'number_of_spots': lot.number_of_spots} for lot in lots]
    redis_client.setex('parking_lots', 300, json.dumps(result))
    return jsonify(result), 200

@api.route('/parking_lots/<int:id>', methods=['PUT', 'DELETE'])
@jwt_required()
def manage_parking_lot(id):
    identity = get_jwt_identity()
    if User.query.get(identity).role != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
    lot = ParkingLot.query.get_or_404(id)
    if request.method == 'PUT':
        data = request.get_json()
        lot.prime_location_name = data.get('prime_location_name', lot.prime_location_name)
        lot.price = data.get('price', lot.price)
        lot.address = data.get('address', lot.address)
        lot.pin_code = data.get('pin_code', lot.pin_code)
        lot.number_of_spots = data.get('number_of_spots', lot.number_of_spots)
        db.session.commit()
        redis_client.delete('parking_lots')
        return jsonify({'message': 'Parking lot updated'}), 200
    if request.method == 'DELETE':
        if any(spot.status == 'O' for spot in lot.spots):
            return jsonify({'message': 'Cannot delete lot with occupied spots'}), 400
        db.session.delete(lot)
        db.session.commit()
        redis_client.delete('parking_lots')
        return jsonify({'message': 'Parking lot deleted'}), 200

@api.route('/spots/<int:lot_id>', methods=['GET'])
@jwt_required()
def get_spots(lot_id):
    cached = redis_client.get(f'spots_{lot_id}')
    if cached:
        return jsonify(json.loads(cached)), 200
    spots = ParkingSpot.query.filter_by(lot_id=lot_id).all()
    result = [{'id': spot.id, 'status': spot.status, 'reservations': [{'user_id': r.user_id} for r in spot.reservations]} for spot in spots]
    redis_client.setex(f'spots_{lot_id}', 300, json.dumps(result))
    return jsonify(result), 200

@api.route('/reserve', methods=['POST'])
@jwt_required()
def reserve():
    identity = get_jwt_identity()
    data = request.get_json()
    lot_id = data.get('lot_id')
    spot = ParkingSpot.query.filter_by(lot_id=lot_id, status='A').first()
    if not spot:
        return jsonify({'message': 'No available spots'}), 400
    spot.status = 'O'
    reservation = Reservation(spot_id=spot.id, user_id=identity, parking_cost=ParkingLot.query.get(lot_id).price)
    db.session.add(reservation)
    db.session.commit()
    redis_client.delete(f'spots_{lot_id}')
    return jsonify({'message': 'Spot reserved', 'spot_id': spot.id}), 200

@api.route('/release/<int:reservation_id>', methods=['POST'])
@jwt_required()
def release(reservation_id):
    identity = get_jwt_identity()
    reservation = Reservation.query.filter_by(id=reservation_id, user_id=identity).first()
    if not reservation:
        return jsonify({'message': 'Reservation not found'}), 404
    reservation.leaving_timestamp = datetime.utcnow()
    reservation.spot.status = 'A'
    db.session.commit()
    redis_client.delete(f'spots_{reservation.spot.lot_id}')
    return jsonify({'message': 'Spot released'}), 200

@api.route('/reservations', methods=['GET'])
@jwt_required()
def get_reservations():
    identity = get_jwt_identity()
    reservations = Reservation.query.filter_by(user_id=identity).all()
    result = [{'id': r.id, 'spot_id': r.spot_id, 'parking_timestamp': r.parking_timestamp.isoformat(), 'leaving_timestamp': r.leaving_timestamp.isoformat() if r.leaving_timestamp else None, 'parking_cost': r.parking_cost} for r in reservations]
    return jsonify(result), 200

@api.route('/export_csv', methods=['POST'])
@jwt_required()
def trigger_export():
    identity = get_jwt_identity()
    export_csv.delay(identity)
    return jsonify({'message': 'Export job started'}), 202

@api.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    if User.query.get(get_jwt_identity()).role != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
    users = User.query.filter_by(role='user').all()
    result = [{'id': user.id, 'username': user.username, 'email': user.email} for user in users]
    return jsonify(result), 200