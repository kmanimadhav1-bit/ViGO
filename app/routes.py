from flask import Blueprint, request, jsonify, render_template
from .database import get_connection
from datetime import datetime
import sqlite3

main = Blueprint("main", __name__)

@main.route("/app")
def frontend():
    return render_template("index.html")

@main.route("/")
def home():
    return {"message": "CampusRide API is running 🚕"}


@main.route("/rides", methods=["POST"])
def create_ride():
    data = request.get_json()

    name = data.get("name")
    contact = data.get("contact")
    destination = data.get("destination")
    date = data.get("date")
    start_time = data.get("start_time")
    end_time = data.get("end_time")
    seats = data.get("seats")

    if not all([name, contact, destination, date, start_time, end_time, seats]):
        return jsonify({"error": "Missing required fields"}), 400
    
        # Validate seats
    if seats <= 0:
        return jsonify({"error": "Seats must be greater than 0"}), 400

    # Validate time logic
    if end_time <= start_time:
        return jsonify({"error": "End time must be after start time"}), 400

    # Validate date format
    try:
        datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        return jsonify({"error": "Date must be in YYYY-MM-DD format"}), 400

    conn = get_connection()
    cursor = conn.cursor()

    # Insert user
    cursor.execute(
        "INSERT INTO users (name, contact) VALUES (?, ?)",
        (name, contact)
    )
    user_id = cursor.lastrowid

    # Insert ride
    cursor.execute(
        """INSERT INTO rides 
        (owner_id, destination, date, start_time, end_time, seats_available)
        VALUES (?, ?, ?, ?, ?, ?)""",
        (user_id, destination, date, start_time, end_time, seats)
    )

    conn.commit()
    conn.close()

    return jsonify({"message": "Ride created successfully"})
@main.route("/rides/search", methods=["GET"])
def search_rides():
    # 1️⃣ Get query parameters
    destination = request.args.get("destination")
    date = request.args.get("date")
    start_time = request.args.get("start_time", type=int)
    end_time = request.args.get("end_time", type=int)

    # 2️⃣ Validate inputs
    if not all([destination, date, start_time, end_time]):
        return jsonify({"error": "Missing search parameters"}), 400

    # 3️⃣ Connect to DB
    conn = get_connection()
    cursor = conn.cursor()

    # 4️⃣ Run SQL query with overlap logic
    cursor.execute("""
        SELECT * FROM rides
        WHERE destination = ?
        AND date = ?
        AND seats_available > 0
        AND NOT (? < start_time OR ? > end_time)
    """, (destination, date, end_time, start_time))

    rides = cursor.fetchall()
    conn.close()

    # 5️⃣ Convert rows to JSON
    result = [dict(ride) for ride in rides]

    return jsonify(result)
@main.route("/rides/join", methods=["POST"])
def join_ride():
    data = request.get_json()

    ride_id = data.get("ride_id")
    name = data.get("name")
    contact = data.get("contact")

    if not all([ride_id, name, contact]):
        return jsonify({"error": "Missing required fields"}), 400

    conn = get_connection()
    cursor = conn.cursor()

    # Check ride exists
    cursor.execute("SELECT seats_available FROM rides WHERE id = ?", (ride_id,))
    ride = cursor.fetchone()

    if not ride:
        conn.close()
        return jsonify({"error": "Ride not found"}), 404

    if ride["seats_available"] <= 0:
        conn.close()
        return jsonify({"error": "Ride is full"}), 400

    # Check if user already exists
    cursor.execute("SELECT id FROM users WHERE contact = ?", (contact,))
    existing_user = cursor.fetchone()

    if existing_user:
        user_id = existing_user["id"]
    else:
        cursor.execute(
            "INSERT INTO users (name, contact) VALUES (?, ?)",
            (name, contact)
        )
        user_id = cursor.lastrowid

    # Check duplicate join
    cursor.execute(
        "SELECT * FROM ride_participants WHERE ride_id = ? AND user_id = ?",
        (ride_id, user_id)
    )
    duplicate = cursor.fetchone()

    if duplicate:
        conn.close()
        return jsonify({"error": "User already joined this ride"}), 400

    # Insert into ride_participantsca
    try:
        cursor.execute(
            "INSERT INTO ride_participants (ride_id, user_id) VALUES (?, ?)",
            (ride_id, user_id)
        )
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({"error": "User already joined this ride"}), 400
    
    # Decrease seats
    cursor.execute(
        "UPDATE rides SET seats_available = seats_available - 1 WHERE id = ?",
        (ride_id,)   # <-- THIS WAS MISSING
    )

    conn.commit()
    conn.close()

    return jsonify({"message": "Joined ride successfully"})