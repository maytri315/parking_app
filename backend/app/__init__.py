from flask import Flask, render_template, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_mail import Mail
from flask_cors import CORS
from config import Config
import os

db = SQLAlchemy()
jwt = JWTManager()
mail = Mail()

def create_app():
    app = Flask(__name__, template_folder='templates', static_folder='static')
    app.config.from_object(Config)
    
    db.init_app(app)
    jwt.init_app(app)
    mail.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    from .routes import api
    from .tasks import configure_celery
    app.register_blueprint(api, url_prefix='/api')
    
    @app.route('/')
    def index():
        return render_template('index.html')
    
    @app.route('/debug/templates')
    def debug_templates():
        template_dir = os.path.join(app.root_path, 'templates')
        templates = [f for f in os.listdir(template_dir) if f.endswith('.html')]
        return jsonify({'template_dir': template_dir, 'templates': templates})
    
    @app.route('/debug/static')
    def debug_static():
        static_dir = os.path.join(app.root_path, 'static')
        static_files = []
        for root, _, files in os.walk(static_dir):
            for f in files:
                if f.endswith(('.js', '.ico')):
                    static_files.append(os.path.relpath(os.path.join(root, f), static_dir))
        return jsonify({'static_dir': static_dir, 'files': static_files})
    
    configure_celery(app)
    
    return app