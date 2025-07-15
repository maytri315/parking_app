# Vehicle Parking App

![GitHub top language](https://img.shields.io/github/languages/top/maytri315/parking_app?style=flat-square)
![GitHub last commit](https://img.shields.io/github/last-commit/maytri315/parking_app?style=flat-square)
![GitHub repo size](https://img.shields.io/github/repo-size/maytri315/parking_app?style=flat-square)

## Table of Contents

-   [About the Project](#about-the-project)
-   [Features](#features)
-   [Technologies Used](#technologies-used)
-   [Getting Started](#getting-started)
    -   [Prerequisites](#prerequisites)
    -   [Backend Setup](#backend-setup)
    -   [Frontend Setup](#frontend-setup)
    -   [API Base URL Configuration](#api-base-url-configuration)
-   [Usage](#usage)
-   [Project Structure](#project-structure)
-   [License](#license)
-   [Contact](#contact)

---

## About the Project

The Vehicle Parking App is a full-stack web application designed to streamline the process of finding, reserving, and managing parking spots. It provides an intuitive interface for users to book spots and a robust administrative panel for managing parking lots, users, and reservations.

This project is built with a Vue.js frontend for a dynamic user experience and a Flask backend for powerful API services and data management.

## Features

**User Features:**
* **User Authentication:** Secure login and registration for new users.
* **Dashboard:** View available parking lots.
* **Parking Spot Selection:** Select a parking lot and reserve a spot.
* **Reservation Management:** View active and past reservations.
* **Reservation Cancellation/Release:** Option to cancel or release an active reservation.
* **Summary Views:** Visual summaries of reservation data (e.g., using charts).

**Admin Features:**
* **Admin Authentication:** Secure admin login.
* **Dashboard:** Overview of parking lots and user accounts.
* **Parking Lot Management:** Create, view, edit, and delete parking lots.
* **User Management:** View all users, block, and unblock user accounts.
* **Spot Management:** View and delete individual spots within a lot.
* **Reporting & Analytics:** Summary of parking data, occupied spots, and search functionalities.
* **Data Cleanup:** Utility to clean up old reservation data.

## Technologies Used

**Frontend:**
* **Vue.js 3:** The progressive JavaScript framework for building user interfaces.
* **Vue Router 4:** For single-page application navigation.
* **Axios:** Promise-based HTTP client for making API requests.
* **Chart.js:** For creating interactive charts in dashboards.
* **Bootstrap 5:** For responsive and modern UI components.

**Backend:**
* **Flask:** A lightweight Python web framework for the API.
* **Flask-SQLAlchemy:** ORM (Object Relational Mapper) for database interactions.
* **SQLite (Development):** Simple file-based database. Can be easily switched to PostgreSQL or MySQL for production.
* **Flask-JWT-Extended:** For handling JSON Web Token (JWT) based authentication.
* **Flask-CORS:** To handle Cross-Origin Resource Sharing.

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

* **Git:** [Download & Install Git](https://git-scm.com/downloads)
* **Python 3.x:** [Download & Install Python](https://www.python.org/downloads/)
* **Node.js & npm (or Yarn):** [Download & Install Node.js](https://nodejs.org/en/download/) (npm comes with Node.js)

### Backend Setup

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/maytri315/parking_app.git](https://github.com/maytri315/parking_app.git)
    cd parking_app
    ```

2.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

3.  **Create and activate a Python virtual environment:**
    ```bash
    python -m venv venv
    .\venv\Scripts\activate   # On Windows
    # source venv/bin/activate # On macOS/Linux
    ```

4.  **Install backend dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
    *(If you don't have `requirements.txt`, you'll need to manually install Flask, Flask-SQLAlchemy, Flask-CORS, Flask-JWT-Extended, etc., then run `pip freeze > requirements.txt`)*

5.  **Initialize the database:**
    *(Assuming your Flask app.py sets up SQLAlchemy and creates tables)*
    ```bash
    python app.py
    # Look for instructions within your app.py if a specific command is needed to create database tables/migrations
    # Often, simply running the app for the first time will create the SQLite database file if it doesn't exist.
    ```
    *Ensure your database configuration in `app.py` points to a local SQLite file (e.g., `sqlite:///site.db`).*

6.  **Run the Flask backend server:**
    ```bash
    python app.py
    ```
    The backend should now be running on `http://127.0.0.1:5000/`.

### Frontend Setup

1.  **Open a new terminal window** (keep the backend terminal running).
2.  **Navigate to the frontend directory:**
    ```bash
    cd C:\Users\Admin\Desktop\parking_app\frontend
    ```

3.  **Install frontend dependencies:**
    ```bash
    npm install
    # Or if you use Yarn: yarn install
    ```

4.  **Run the Vue.js development server:**
    ```bash
    npm run serve
    # Or if you use Yarn: yarn serve
    ```
    The frontend should now be running on `http://localhost:8080/`.

### API Base URL Configuration

The frontend needs to know where your backend API is. This is configured using an environment variable.

1.  **Create a `.env.development` file** in your `frontend` directory (if it doesn't already exist):
    `C:\Users\Admin\Desktop\parking_app\frontend\.env.development`

2.  **Add your backend API URL to it:**
    ```
    VUE_APP_API_BASE_URL=http://localhost:5000
    ```
    *(Ensure this matches the address your Flask backend is running on.)*

3.  Restart your frontend server (`npm run serve`) if you've just created or modified this file.

---

## Usage

1.  **Access the application:** Open your web browser and go to `http://localhost:8080/`.
2.  **Register:** Create a new user account. You can choose to register as a regular user or an admin.
3.  **Login:** Use your registered credentials to log in.
4.  **Explore Dashboards:**
    * **User Dashboard:** View available parking lots, manage your reservations, and see a summary of your activity.
    * **Admin Dashboard:** Manage parking lots, users, view detailed summaries, and perform administrative tasks.
5.  **Interact:** Follow the on-screen prompts to create lots, reserve spots, block users, etc.

---

## Project Structure

The project follows a typical full-stack architecture:
