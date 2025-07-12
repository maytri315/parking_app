from celery import Celery
from celery.schedules import crontab
from .models import db, User, ParkingLot, Reservation
from flask_mail import Mail, Message
from config import Config
import requests
import csv
import io

celery = Celery('tasks', broker=Config.CELERY_BROKER_URL, backend=Config.CELERY_RESULT_BACKEND)
mail = Mail()

def configure_celery(app):
    celery.conf.update(app.config)
    celery.conf.beat_schedule = {
        'daily-reminder': {
            'task': 'app.tasks.daily_reminder',
            'schedule': crontab(hour=18, minute=0)  # 6 PM daily
        },
        'monthly-report': {
            'task': 'app.tasks.monthly_report',
            'schedule': crontab(day_of_month=1, hour=0, minute=0)  # 1st of every month
        }
    }

@celery.task
def daily_reminder():
    users = User.query.filter_by(role='user').all()
    new_lots = ParkingLot.query.filter(ParkingLot.id > 0).count() > 0
    for user in users:
        if not user.reservations or new_lots:
            requests.post(Config.GOOGLE_CHAT_WEBHOOK, json={'text': f'Hi {user.username}, book a parking spot today!'})

@celery.task
def monthly_report():
    users = User.query.filter_by(role='user').all()
    for user in users:
        reservations = user.reservations
        total_cost = sum(r.parking_cost for r in reservations if r.parking_cost)
        report = f"""
        <h1>Monthly Parking Report for {user.username}</h1>
        <p>Spots booked: {len(reservations)}</p>
        <p>Total spent: ${total_cost:.2f}</p>
        <table border='1'>
            <tr><th>Spot ID</th><th>Parking Time</th><th>Cost</th></tr>
            {''.join(f'<tr><td>{r.spot_id}</td><td>{r.parking_timestamp}</td><td>{r.parking_cost}</td></tr>' for r in reservations)}
        </table>
        """
        msg = Message('Monthly Parking Report', recipients=[user.email], html=report)
        mail.send(msg)

@celery.task
def export_csv(user_id):
    user = User.query.get(user_id)
    reservations = user.reservations
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Reservation ID', 'Spot ID', 'Parking Time', 'Leaving Time', 'Cost'])
    for r in reservations:
        writer.writerow([r.id, r.spot_id, r.parking_timestamp, r.leaving_timestamp, r.parking_cost])
    # Simulate sending CSV via email or saving for download
    msg = Message('Parking History CSV', recipients=[user.email], body='Your parking history is attached.')
    msg.attach('history.csv', 'text/csv', output.getvalue())
    mail.send(msg)
    output.close()