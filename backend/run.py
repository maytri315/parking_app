from app import create_app, db
from app.routes import init_admin

app = create_app()

with app.app_context():
    db.create_all()
    init_admin()

if __name__ == '__main__':
    app.run(debug=True)