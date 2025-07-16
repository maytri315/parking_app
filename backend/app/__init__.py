# C:\Users\Admin\Desktop\parking_app\backend\app\__init__.py

from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from celery import Celery
import os
from datetime import timedelta

# Initialize extensions here, but defer app initialization
db = SQLAlchemy()
bcrypt = Bcrypt()
jwt = JWTManager()
celery = Celery(__name__)

def create_app():
    app = Flask(__name__) # Removed static_folder and template_folder for API-only backend during development

    # If you are using config.Config, remove the direct app.config assignments below
    # and ensure config.py exists and contains all necessary configurations.
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///site.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your_super_secret_key_change_this_in_production')
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'your_jwt_secret_key_change_this_in_production')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
    app.config['CELERY_BROKER_URL'] = os.environ.get('CELERY_BROKER_URL', 'redis://localhost:6379/0')
    app.config['CELERY_RESULT_BACKEND'] = os.environ.get('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')

    # If using app.config.from_object('config.Config'), ensure config.py is correct
    # app.config.from_object('config.Config') # Uncomment this and make sure config.py is configured

    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}})

    celery.conf.update(app.config)

    class ContextTask(celery.Task):
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return super().__call__(*args, **kwargs)
    celery.Task = ContextTask

    # Imports for blueprints and models within the package
    from .routes import api as api_blueprint
    app.register_blueprint(api_blueprint, url_prefix='/api')

    from . import models # This imports the models.py file within the same 'app' package

    with app.app_context():
        db.create_all()

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

# IMPORTANT: Remove the if __name__ == '__main__': block from here.
# It should ONLY be in run.py (or your primary entry point).