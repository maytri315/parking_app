# C:\Users\Admin\Desktop\parking_app\backend\app\__init__.py

# ... (other imports)
from flask_cors import CORS 
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from flask import Flask, jsonify # Make sure Flask is included here

db = SQLAlchemy()
bcrypt = Bcrypt()
jwt = JWTManager()

def create_app():
    app = Flask(__name__)
    app.config.from_object('config.Config')

    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)

    # This is the crucial part for CORS:
    CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}})

    from .routes import api as api_blueprint
    app.register_blueprint(api_blueprint, url_prefix='/api')

    # ... (rest of your app setup)
    return app