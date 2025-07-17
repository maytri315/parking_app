import sys
import os
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from app import create_app, db
from app.routes import init_admin
from flask_cors import CORS
from app.celery_config import make_celery
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = create_app()
CORS(app, resources={r"/*": {
    "origins": ["http://localhost:5173", "http://127.0.0.1:5173"],
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"]
}})
celery = make_celery(app)

# Log CORS requests
@app.after_request
def log_response(response):
    logger.debug(f"Response Headers: {response.headers}")
    return response

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, host='0.0.0.0', port=5000)