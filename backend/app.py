from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from celery import Celery
import os
from datetime import timedelta # <--- Make sure this is also imported in models.py if used there

# Initialize extensions here, but defer app initialization
db = SQLAlchemy()
bcrypt = Bcrypt()
jwt = JWTManager()
celery = Celery(__name__)

def create_app():
    # Get the absolute path to the directory containing this file (your 'app' module)
    basedir = os.path.abspath(os.path.dirname(__file__))

    # Removed static_folder and template_folder as they are not needed for a pure API backend in development
    app = Flask(__name__) 

    # Configuration from environment variables or direct values
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///site.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your_super_secret_key_change_this_in_production')
    
    # JWT Configuration
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'your_jwt_secret_key_change_this_in_production')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24) # Tokens expire in 24 hours

    # Celery Configuration
    app.config['CELERY_BROKER_URL'] = os.environ.get('CELERY_BROKER_URL', 'redis://localhost:6379/0')
    app.config['CELERY_RESULT_BACKEND'] = os.environ.get('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')

    # Initialize extensions with the app
    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)

    # ----------------------------------------------------
    # CORRECTED CORS Configuration (more secure than just CORS(app))
    # ----------------------------------------------------
    CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}})

    # Initialize Celery with Flask app context
    celery.conf.update(app.config)

    class ContextTask(celery.Task):
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return super().__call__(*args, **kwargs) # Use super() for clarity
    celery.Task = ContextTask

    # ----------------------------------------------------
    # CRITICAL FIX: Change relative imports to absolute imports
    # ----------------------------------------------------
    # Assuming your structure is backend/app.py and backend/app/routes.py, backend/app/models.py
    from app.routes import api as api_blueprint # <--- CHANGED THIS LINE!
    app.register_blueprint(api_blueprint, url_prefix='/api')

    from app import models # <--- CHANGED THIS LINE!

    # Create database tables if they don't exist
    with app.app_context():
        db.create_all()

    # JWT Error Handlers
    @jwt.unauthorized_loader
    def unauthorized_response(callback):
        return jsonify({"msg": "Missing or invalid token"}), 401

    @jwt.expired_token_loader
    def expired_token_response(callback):
        return jsonify({"msg": "Token has expired"}), 401
    
    @jwt.invalid_token_loader
    def invalid_token_response(callback):
        return jsonify({"msg": "Signature verification failed"}), 401

    return app

# This block allows you to run the app directly
if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)