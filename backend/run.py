# C:\Users\Admin\Desktop\parking_app\backend\run.py

from app import create_app # This imports create_app from your 'app' package (__init__.py)

app = create_app()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)