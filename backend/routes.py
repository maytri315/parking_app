from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, create_access_token, get_jwt_identity
from .app import db
from import models User, ParkingLot, ParkingSpot, Reservation
import redis
from datetime import datetime
from .tasks import send_reminder, export_reservations, monthly_report

api = Blueprint('api', __name__)

@api.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    email = data.get('email')
    if User.query.filter_by(username=username).first() or User.query.filter_by(email=email).first():
        return jsonify({"message": "User already exists"}), 400
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
    user = User.query.filter_by(username=username).first()
    if user and user.check_password(password):
        access_token = create_access_token(identity={'username': user.username, 'role': user.role})
        return jsonify({"access_token": access_token}), 200
    return jsonify({"message": "Invalid credentials"}), 401

@api.route('/parking_lots', methods=['GET', 'POST'])
@jwt_required()
def parking_lots():
    r = redis.Redis.from_url('redis://localhost:6379/0')
    cache_key = 'parking_lots'
    cached = r.get(cache_key)
    if cached:
        return jsonify({"source": "cache", "data": eval(cached.decode())}), 200
    if request.method == 'GET':
        lots = ParkingLot.query.all()
        data = [{"id": lot.id, "prime_location_name": lot.prime_location_name, "price": lot.price,
                 "address": lot.address, "pin_code": lot.pin_code, "number_of_spots": lot.number_of_spots} for lot in lots]
        r.setex(cache_key, 300, str(data))
        return jsonify({"source": "db", "data": data}), 200
    else:
        identity = get_jwt_identity()
        if identity['role'] != 'admin':
            return jsonify({"message": "Admin access required"}), 403
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
        for i in range(data['number_of_spots']):
            spot = ParkingSpot(parking_lot_id=lot.id, status='A')
            db.session.add(spot)
        db.session.commit()
        r.delete(cache_key)
        return jsonify({"message": "Parking lot created"}), 201

@api.route('/parking_lots/<int:id>', methods=['PUT', 'DELETE'])
@jwt_required()
def parking_lot(id):
    identity = get_jwt_identity()
    if identity['role'] != 'admin':
        return jsonify({"message": "Admin access required"}), 403
    lot = ParkingLot.query.get_or_404(id)
    r = redis.Redis.from_url('redis://localhost:6379/0')
    cache_key = 'parking_lots'
    if request.method == 'PUT':
        data = request.get_json()
        lot.prime_location_name = data['prime_location_name']
        lot.price = data['price']
        lot.address = data['address']
        lot.pin_code = data['pin_code']
        lot.number_of_spots = data['number_of_spots']
        db.session.commit()
        r.delete(cache_key)
        return jsonify({"message": "Parking lot updated"}), 200
    else:
        spots = ParkingSpot.query.filter_by(parking_lot_id=id).all()
        if any(spot.status == 'O' for spot in spots):
            return jsonify({"message": "Cannot delete lot with occupied spots"}), 400
        db.session.delete(lot)
        db.session.commit()
        r.delete(cache_key)
        return jsonify({"message": "Parking lot deleted"}), 200

@api.route('/spots/<int:lot_id>', methods=['GET'])
@jwt_required()
def spots(lot_id):
    r = redis.Redis.from_url('redis://localhost:6379/0')
    cache_key = f'spots_{lot_id}'
    cached = r.get(cache_key)
    if cached:
        return jsonify({"source": "cache", "data": eval(cached.decode())}), 200
    spots = ParkingSpot.query.filter_by(parking_lot_id=lot_id).all()
    data = [{"id": spot.id, "parking_lot_id": spot.parking_lot_id, "status": spot.status} for spot in spots]
    r.setex(cache_key, 300, str(data))
    return jsonify({"source": "db", "data": data}), 200

@api.route('/reserve', methods=['POST'])
@jwt_required()
def reserve():
    identity = get_jwt_identity()
    user = User.query.filter_by(username=identity['username']).first()
    data = request.get_json()
    lot_id = data['lot_id']
    spot = ParkingSpot.query.filter_by(parking_lot_id=lot_id, status='A').first()
    if not spot:
        return jsonify({"message": "No available spots"}), 400
    lot = ParkingLot.query.get(lot_id)
    reservation = Reservation(
        user_id=user.id,
        spot_id=spot.id,
        parking_timestamp=datetime.utcnow(),
        parking_cost=lot.price
    )
    spot.status = 'O'
    db.session.add(reservation)
    db.session.commit()
    r = redis.Redis.from_url('redis://localhost:6379/0')
    r.delete(f'spots_{lot_id}')
    send_reminder.apply_async(args=[user.id, reservation.id], eta=datetime.utcnow().replace(hour=18, minute=0, second=0))
    return jsonify({"message": "Spot reserved", "reservation_id": reservation.id}), 200

@api.route('/release/<int:reservation_id>', methods=['POST'])
@jwt_required()
def release(reservation_id):
    identity = get_jwt_identity()
    user = User.query.filter_by(username=identity['username']).first()
    reservation = Reservation.query.filter_by(id=reservation_id, user_id=user.id).first()
    if not reservation:
        return jsonify({"message": "Reservation not found"}), 404
    reservation.leaving_timestamp = datetime.utcnow()
    spot = ParkingSpot.query.get(reservation.spot_id)
    spot.status = 'A'
    db.session.commit()
    r = redis.Redis.from_url('redis://localhost:6379/0')
    r.delete(f'spots_{reservation.spot.parking_lot_id}')
    return jsonify({"message": "Spot released"}), 200

@api.route('/reservations', methods=['GET'])
@jwt_required()
def reservations():
    identity = get_jwt_identity()
    user = User.query.filter_by(username=identity['username']).first()
    reservations = Reservation.query.filter_by(user_id=user.id).all()
    data = [{"id": r.id, "spot_id": r.spot_id, "parking_timestamp": r.parking_timestamp.isoformat(),
             "leaving_timestamp": r.leaving_timestamp.isoformat() if r.leaving_timestamp else None,
             "parking_cost": r.parking_cost} for r in reservations]
    return jsonify(data), 200

@api.route('/export_csv', methods=['POST'])
@jwt_required()
def export_csv():
    identity = get_jwt_identity()
    user = User.query.filter_by(username=identity['username']).first()
    export_reservations.delay(user.id, user.email)
    return jsonify({"message": "Export job started"}), 202

@api.route('/users', methods=['GET'])
@jwt_required()
def users():
    identity = get_jwt_identity()
    if identity['role'] != 'admin':
        return jsonify({"message": "Admin access required"}), 403
    users = User.query.all()
    data = [{"id": u.id, "username": u.username, "email": u.email, "role": u.role} for u in users]
    return jsonify(data), 200