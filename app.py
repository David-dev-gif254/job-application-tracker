from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
from datetime import datetime
from urllib.parse import urlparse

load_dotenv()

app = Flask(__name__)
CORS(app)

ALLOWED_STATUSES = {"Applied", "Interview", "Accepted", "Rejected"}


def get_db_connection():
    database_url = os.getenv("DATABASE_URL")

    if not database_url:
        raise RuntimeError("DATABASE_URL environment variable is not set.")

    return psycopg2.connect(database_url)


def initialize_database():
    connection = get_db_connection()

    try:
        cursor = connection.cursor()

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS applications (
                id SERIAL PRIMARY KEY,
                company VARCHAR(100) NOT NULL,
                position VARCHAR(150) NOT NULL,
                status VARCHAR(50) NOT NULL,
                date DATE,
                url VARCHAR(500),
                notes TEXT
            )
        """)

        connection.commit()
        cursor.close()

    finally:
        connection.close()


def validate_application(data):
    if not isinstance(data, dict):
        return "Request body must be JSON."

    company = str(data.get("company", "")).strip()
    position = str(data.get("position", "")).strip()
    status = str(data.get("status", "")).strip()
    date_value = data.get("date")
    url = str(data.get("url", "")).strip()
    notes = str(data.get("notes", "")).strip()

    if not company:
        return "Company is required."

    if len(company) > 100:
        return "Company name is too long."

    if not position:
        return "Position is required."

    if len(position) > 150:
        return "Position name is too long."

    if status not in ALLOWED_STATUSES:
        return "Invalid application status."

    if date_value:
        try:
            datetime.strptime(str(date_value), "%Y-%m-%d")
        except ValueError:
            return "Date must use YYYY-MM-DD format."

    if url:
        parsed_url = urlparse(url)

        if parsed_url.scheme not in {"http", "https"} or not parsed_url.netloc:
            return "URL must be a valid HTTP or HTTPS URL."

    if len(notes) > 5000:
        return "Notes are too long."

    return None


@app.route("/")
def home():
    return jsonify({
        "message": "Job Application Tracker API is running!"
    })


@app.route("/api/test")
def test_database():
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute("SELECT 1")
        result = cursor.fetchone()

        return jsonify({
            "database_test": result[0],
            "message": "Flask and PostgreSQL are connected!"
        })

    except Exception as error:
        return jsonify({
            "error": str(error)
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()


@app.route("/api/applications", methods=["GET"])
def get_applications():
    connection = None
    cursor = None

    try:
        connection = get_db_connection()

        cursor = connection.cursor(cursor_factory=RealDictCursor)

        cursor.execute("""
            SELECT
                id,
                company,
                position,
                status,
                date,
                url,
                notes
            FROM applications
            ORDER BY id DESC
        """)

        applications = cursor.fetchall()

        for application in applications:
            if application["date"]:
                application["date"] = application["date"].isoformat()

        return jsonify(applications)

    except Exception as error:
        return jsonify({
            "error": str(error)
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()


@app.route("/api/applications", methods=["POST"])
def add_application():
    data = request.get_json(silent=True)

    validation_error = validate_application(data)

    if validation_error:
        return jsonify({
            "error": validation_error
        }), 400

    connection = None
    cursor = None

    try:
        company = data["company"].strip()
        position = data["position"].strip()
        status = data["status"].strip()
        date_value = data.get("date") or None
        url = data.get("url", "").strip()
        notes = data.get("notes", "").strip()

        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute("""
            INSERT INTO applications
            (company, position, status, date, url, notes)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            company,
            position,
            status,
            date_value,
            url,
            notes
        ))

        application_id = cursor.fetchone()[0]

        connection.commit()

        return jsonify({
            "message": "Application added successfully.",
            "id": application_id
        }), 201

    except Exception as error:
        if connection:
            connection.rollback()

        return jsonify({
            "error": str(error)
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()


@app.route("/api/applications/<int:application_id>", methods=["PUT"])
def update_application(application_id):
    data = request.get_json(silent=True)

    validation_error = validate_application(data)

    if validation_error:
        return jsonify({
            "error": validation_error
        }), 400

    connection = None
    cursor = None

    try:
        company = data["company"].strip()
        position = data["position"].strip()
        status = data["status"].strip()
        date_value = data.get("date") or None
        url = data.get("url", "").strip()
        notes = data.get("notes", "").strip()

        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute("""
            UPDATE applications
            SET
                company = %s,
                position = %s,
                status = %s,
                date = %s,
                url = %s,
                notes = %s
            WHERE id = %s
        """, (
            company,
            position,
            status,
            date_value,
            url,
            notes,
            application_id
        ))

        if cursor.rowcount == 0:
            return jsonify({
                "error": "Application not found."
            }), 404

        connection.commit()

        return jsonify({
            "message": "Application updated successfully."
        })

    except Exception as error:
        if connection:
            connection.rollback()

        return jsonify({
            "error": str(error)
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()


@app.route("/api/applications/<int:application_id>", methods=["DELETE"])
def delete_application(application_id):
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute("""
            DELETE FROM applications
            WHERE id = %s
        """, (application_id,))

        if cursor.rowcount == 0:
            return jsonify({
                "error": "Application not found."
            }), 404

        connection.commit()

        return jsonify({
            "message": "Application deleted successfully."
        })

    except Exception as error:
        if connection:
            connection.rollback()

        return jsonify({
            "error": str(error)
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()


@app.route("/api/applications", methods=["DELETE"])
def delete_all_applications():
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute("DELETE FROM applications")

        deleted_count = cursor.rowcount

        connection.commit()

        return jsonify({
            "message": "All applications deleted successfully.",
            "deleted": deleted_count
        })

    except Exception as error:
        if connection:
            connection.rollback()

        return jsonify({
            "error": str(error)
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()


# Create the database table when the application starts
try:
    initialize_database()
    print("Database initialized successfully.")
except Exception as error:
    print("Database initialization failed:", error)


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)