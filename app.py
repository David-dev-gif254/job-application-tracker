from flask import Flask, jsonify, request
from flask_cors import CORS
import mysql.connector
import os
from dotenv import load_dotenv
from datetime import datetime
from urllib.parse import urlparse


# Load environment variables
load_dotenv()


app = Flask(__name__)

CORS(app)


# ==========================================
# SETTINGS
# ==========================================

ALLOWED_STATUSES = {
    "Applied",
    "Interview",
    "Accepted",
    "Rejected"
}


# ==========================================
# MYSQL DATABASE CONNECTION
# ==========================================

def get_db_connection():

    return mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        port=int(os.getenv("DB_PORT", 3306)),
        user=os.getenv("DB_USER"),
        password=os.getenv("#DB_PASSWORD"),
        database=os.getenv("DB_NAME")
    )


# ==========================================
# VALIDATE APPLICATION DATA
# ==========================================

def validate_application(data):

    if not isinstance(data, dict):
        return "Invalid request data."


    company = data.get("company", "").strip()
    position = data.get("position", "").strip()
    status = data.get("status", "Applied")
    date = data.get("date")
    url = data.get("url", "").strip()


    # Company validation
    if not company:

        return "Company name is required."


    if len(company) > 100:

        return "Company name must be 100 characters or less."


    # Position validation
    if not position:

        return "Position is required."


    if len(position) > 150:

        return "Position must be 150 characters or less."


    # Status validation
    if status not in ALLOWED_STATUSES:

        return "Invalid application status."


    # Date validation
    if date:

        try:

            datetime.strptime(date, "%Y-%m-%d")

        except ValueError:

            return "Invalid date. Use YYYY-MM-DD."


    # URL validation
    if url:

        parsed_url = urlparse(url)

        if parsed_url.scheme not in ("http", "https"):

            return "URL must start with http:// or https://"


        if not parsed_url.netloc:

            return "Please enter a valid URL."


    return None


# ==========================================
# HOME
# ==========================================

@app.route("/")
def home():

    return "Job Application Tracker API is running!"


# ==========================================
# GET ALL APPLICATIONS
# ==========================================

@app.route("/api/applications", methods=["GET"])
def get_applications():

    connection = None
    cursor = None

    try:

        connection = get_db_connection()

        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            "SELECT * FROM applications ORDER BY id DESC"
        )

        applications = cursor.fetchall()

        return jsonify(applications)


    except mysql.connector.Error as error:

        print("Database error:", error)

        return jsonify({
            "error": "Unable to load applications."
        }), 500


    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# ==========================================
# ADD APPLICATION
# ==========================================

@app.route("/api/applications", methods=["POST"])
def add_application():

    data = request.get_json()

    error = validate_application(data)

    if error:

        return jsonify({
            "error": error
        }), 400


    company = data.get("company").strip()
    position = data.get("position").strip()
    status = data.get("status", "Applied")
    date = data.get("date") or None
    url = data.get("url", "").strip()
    notes = data.get("notes", "").strip()


    if len(notes) > 5000:

        return jsonify({
            "error": "Notes must be 5000 characters or less."
        }), 400


    connection = None
    cursor = None

    try:

        connection = get_db_connection()

        cursor = connection.cursor()


        sql = """
            INSERT INTO applications
            (company, position, status, date, url, notes)
            VALUES (%s, %s, %s, %s, %s, %s)
        """


        values = (
            company,
            position,
            status,
            date,
            url,
            notes
        )


        cursor.execute(sql, values)

        connection.commit()


        new_id = cursor.lastrowid


        return jsonify({
            "id": new_id,
            "company": company,
            "position": position,
            "status": status,
            "date": date,
            "url": url,
            "notes": notes
        }), 201


    except mysql.connector.Error as error:

        print("Database error:", error)

        return jsonify({
            "error": "Unable to save application."
        }), 500


    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# ==========================================
# EDIT APPLICATION
# ==========================================

@app.route(
    "/api/applications/<int:application_id>",
    methods=["PUT"]
)
def update_application(application_id):

    data = request.get_json()

    error = validate_application(data)

    if error:

        return jsonify({
            "error": error
        }), 400


    company = data.get("company").strip()
    position = data.get("position").strip()
    status = data.get("status", "Applied")
    date = data.get("date") or None
    url = data.get("url", "").strip()
    notes = data.get("notes", "").strip()


    if len(notes) > 5000:

        return jsonify({
            "error": "Notes must be 5000 characters or less."
        }), 400


    connection = None
    cursor = None

    try:

        connection = get_db_connection()

        cursor = connection.cursor()


        sql = """
            UPDATE applications

            SET
                company = %s,
                position = %s,
                status = %s,
                date = %s,
                url = %s,
                notes = %s

            WHERE id = %s
        """


        values = (
            company,
            position,
            status,
            date,
            url,
            notes,
            application_id
        )


        cursor.execute(sql, values)

        connection.commit()


        if cursor.rowcount == 0:

            return jsonify({
                "error": "Application not found."
            }), 404


        return jsonify({
            "id": application_id,
            "company": company,
            "position": position,
            "status": status,
            "date": date,
            "url": url,
            "notes": notes
        })


    except mysql.connector.Error as error:

        print("Database error:", error)

        return jsonify({
            "error": "Unable to update application."
        }), 500


    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# ==========================================
# DELETE ONE APPLICATION
# ==========================================

@app.route(
    "/api/applications/<int:application_id>",
    methods=["DELETE"]
)
def delete_application(application_id):

    connection = None
    cursor = None

    try:

        connection = get_db_connection()

        cursor = connection.cursor()


        cursor.execute(
            "DELETE FROM applications WHERE id = %s",
            (application_id,)
        )


        connection.commit()


        if cursor.rowcount == 0:

            return jsonify({
                "error": "Application not found."
            }), 404


        return jsonify({
            "message": "Application deleted successfully."
        })


    except mysql.connector.Error as error:

        print("Database error:", error)

        return jsonify({
            "error": "Unable to delete application."
        }), 500


    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# ==========================================
# DELETE ALL APPLICATIONS
# ==========================================

@app.route(
    "/api/applications",
    methods=["DELETE"]
)
def delete_all_applications():

    connection = None
    cursor = None

    try:

        connection = get_db_connection()

        cursor = connection.cursor()


        cursor.execute(
            "DELETE FROM applications"
        )


        connection.commit()


        return jsonify({
            "message": "All applications deleted successfully."
        })


    except mysql.connector.Error as error:

        print("Database error:", error)

        return jsonify({
            "error": "Unable to delete applications."
        }), 500


    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# ==========================================
# TEST DATABASE CONNECTION
# ==========================================

@app.route("/api/test")
def test():

    connection = None
    cursor = None

    try:

        connection = get_db_connection()

        cursor = connection.cursor()

        cursor.execute("SELECT 1")

        result = cursor.fetchone()


        return jsonify({
            "message": "Flask and MySQL are connected!",
            "database_test": result[0]
        })


    except mysql.connector.Error as error:

        print("Database error:", error)

        return jsonify({
            "error": "Database connection failed."
        }), 500


    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# ==========================================
# START SERVER
# ==========================================

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)