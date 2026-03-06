import sqlite3

DB_NAME = "campusride.db"

def get_connection():
    conn = sqlite3.connect(DB_NAME, timeout=5)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # Users table (contact UNIQUE)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            contact TEXT NOT NULL UNIQUE
        );
    """)

    # Rides table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS rides (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            owner_id INTEGER,
            destination TEXT NOT NULL,
            date TEXT NOT NULL,
            start_time INTEGER NOT NULL,
            end_time INTEGER NOT NULL,
            seats_available INTEGER NOT NULL,
            FOREIGN KEY (owner_id) REFERENCES users (id)
        );
    """)

    # Ride participants (prevent duplicate join)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ride_participants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ride_id INTEGER,
            user_id INTEGER,
            UNIQUE(ride_id, user_id),
            FOREIGN KEY (ride_id) REFERENCES rides (id),
            FOREIGN KEY (user_id) REFERENCES users (id)
        );
    """)

    conn.commit()
    conn.close()