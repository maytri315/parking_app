# parking_app/backend/config.py

from datetime import timedelta

class Config:
    SECRET_KEY = 'your-super-secret-key-please-change-this-for-production'
    SQLALCHEMY_DATABASE_URI = 'sqlite:////home/admin1/parking_app/backend/databasefiles/parking.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = 'your-jwt-secret-key-please-change-this-too'

    # Mail Configuration (for alerts) - Using Gmail SMTP example
    MAIL_SERVER = 'smtp.gmail.com'
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USERNAME = 'your-email@gmail.com'
    MAIL_PASSWORD = 'your-app-password'

    # Celery (for background tasks like sending emails)
    REDIS_URL = 'redis://localhost:6379/0'
    CELERY_BROKER_URL = REDIS_URL
    CELERY_RESULT_BACKEND = REDIS_URL

    # Celery Beat Schedule
    CELERY_BEAT_SCHEDULE = {
        'check-alerts-every-minute': {
            'task': 'tasks.check_and_send_alerts',
            'schedule': timedelta(minutes=1),
            'args': ()
        },
    }