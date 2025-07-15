# parking_app/backend/tasks.py

from celery import Celery
from flask import Flask
from flask_mail import Mail, Message
from datetime import datetime, timedelta
from .config import Config
from .models import db, User, ParkingLot, Booking # Import db, User, ParkingLot, Booking

# Initialize Celery
celery = Celery(__name__, broker=Config.CELERY_BROKER_URL, backend=Config.CELERY_RESULT_BACKEND)
celery.conf.update(Config.__dict__) # Pass Flask config to Celery

def create_app_for_celery():
    """Helper to create a Flask app context for Celery tasks."""
    app = Flask(__name__)
    app.config.from_object(Config)
    db.init_app(app)  # Initialize db with the app instance
    Mail(app)         # Initialize Mail within this app context
    return app

@celery.task
def send_booking_reminder_email(user_email, username, message_context=""):
    """Sends an email reminder to a user."""
    app = create_app_for_celery()
    with app.app_context():
        mail = Mail(app)
        msg = Message("Action Required: Book Your Parking Spot!",
                      sender=app.config['MAIL_USERNAME'],
                      recipients=[user_email])
        msg.html = f"""
        <html>
            <body>
                <p>Dear {username},</p>
                <p>{message_context}</p>
                <p>Don't miss out on securing your spot! Visit our app to find and book your preferred parking lot:</p>
                <p><a href="http://127.0.0.1:8080">Go to Parking App</a></p>
                <p>Best regards,<br>The Parking App Team</p>
            </body>
        </html>
        """
        try:
            mail.send(msg)
            print(f"Reminder email sent to {user_email}")
        except Exception as e:
            print(f"Error sending email to {user_email}: {e}")

@celery.task
def check_and_send_alerts():
    """
    Celery periodic task to check for users who haven't booked
    or newly created parking lots, and send email alerts.
    """
    app = create_app_for_celery()
    with app.app_context():
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Running check_and_send_alerts task...")

        # 1. Identify users who have never made a booking
        users_never_booked = User.query.filter(~User.bookings.any()).all()

        # 2. Identify newly created parking lots (e.g., in the last 24 hours)
        time_threshold = datetime.utcnow() - timedelta(days=1)
        new_lots = ParkingLot.query.filter(ParkingLot.created_at >= time_threshold).all()

        general_booking_message = "We noticed you haven't booked a parking spot yet."
        new_lot_message_prefix = "A new parking lot has been added: "

        sent_to_emails = set()

        for user in users_never_booked:
            if user.email not in sent_to_emails:
                send_booking_reminder_email.delay(user.email, user.username, general_booking_message)
                sent_to_emails.add(user.email)
                print(f"Alert: User {user.username} (never booked). Sending general reminder.")

        for lot in new_lots:
            active_users = User.query.all()
            for user in active_users:
                if user.email not in sent_to_emails:
                    message = f"{new_lot_message_prefix} '{lot.prime_location_name}' at {lot.address} ({lot.pin_code}) with {lot.number_of_spots} spots, priced at ${lot.price:.2f}."
                    send_booking_reminder_email.delay(user.email, user.username, message)
                    sent_to_emails.add(user.email)
                    print(f"Alert: User {user.username}. Sending new lot reminder for '{lot.prime_location_name}'.")

        if not users_never_booked and not new_lots:
            print("No specific alerts to send based on current criteria.")