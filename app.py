from flask import Flask, jsonify, request
from flask_cors import CORS
import mysql.connector
import os
from dotenv import load_dotenv


# Load environment variables from .env
load_dotenv()


app = Flask(__name__)

CORS(app)


# ==========================================
# MYSQL DATABASE CONNECTION
# ==========================================

def get_db_connection():

    return mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        port=int(os.getenv("DB_PORT", 3306)),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME")
    )


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

    connection = get_db_connection()

    cursor = connection.cursor(dictionary=True)

    cursor.execute(
        "SELECT * FROM applications ORDER BY id DESC"
    )

    applications = cursor.fetchall()

    cursor.close()
    connection.close()

    return jsonify(applications)


# ==========================================
# ADD APPLICATION
# ==========================================

@app.route("/api/applications", methods=["POST"])
def add_application():

    data = request.get_json()

    company = data.get("company", "").strip()
    position = data.get("position", "").strip()
    status = data.get("status", "Applied")
    date = data.get("date") or None
    url = data.get("url", "").strip()
    notes = data.get("notes", "").strip()


    if company == "" or position == "":

        return jsonify({
            "error": "Company and position are required."
        }), 400


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


    cursor.close()
    connection.close()


    return jsonify({
        "id": new_id,
        "company": company,
        "position": position,
        "status": status,
        "date": date,
        "url": url,
        "notes": notes
    }), 201


# ==========================================
# EDIT APPLICATION
# ==========================================

@app.route(
    "/api/applications/<int:application_id>",
    methods=["PUT"]
)
def update_application(application_id):

    data = request.get_json()

    company = data.get("company", "").strip()
    position = data.get("position", "").strip()
    status = data.get("status", "Applied")
    date = data.get("date") or None
    url = data.get("url", "").strip()
    notes = data.get("notes", "").strip()


    if company == "" or position == "":

        return jsonify({
            "error": "Company and position are required."
        }), 400


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

        cursor.close()
        connection.close()

        return jsonify({
            "error": "Application not found."
        }), 404


    cursor.close()
    connection.close()


    return jsonify({
        "id": application_id,
        "company": company,
        "position": position,
        "status": status,
        "date": date,
        "url": url,
        "notes": notes
    })


# ==========================================
# DELETE ONE APPLICATION
# ==========================================

@app.route(
    "/api/applications/<int:application_id>",
    methods=["DELETE"]
)
def delete_application(application_id):

    connection = get_db_connection()

    cursor = connection.cursor()


    cursor.execute(
        "DELETE FROM applications WHERE id = %s",
        (application_id,)
    )


    connection.commit()


    if cursor.rowcount == 0:

        cursor.close()
        connection.close()

        return jsonify({
            "error": "Application not found."
        }), 404


    cursor.close()
    connection.close()


    return jsonify({
        "message": "Application deleted successfully."
    })


# ==========================================
# DELETE ALL APPLICATIONS
# ==========================================

@app.route(
    "/api/applications",
    methods=["DELETE"]
)
def delete_all_applications():

    connection = get_db_connection()

    cursor = connection.cursor()


    cursor.execute(
        "DELETE FROM applications"
    )


    connection.commit()


    cursor.close()
    connection.close()


    return jsonify({
        "message": "All applications deleted successfully."
    })


# ==========================================
# TEST DATABASE CONNECTION
# ==========================================

@app.route("/api/test")
def test():

    connection = get_db_connection()

    cursor = connection.cursor()

    cursor.execute(
        "SELECT 1"
    )

    result = cursor.fetchone()


    cursor.close()
    connection.close()


    return jsonify({
        "message": "Flask and MySQL are connected!",
        "database_test": result[0]
    })


# ==========================================
# START SERVER
# ==========================================

if __name__ == "__main__":

    app.run(debug=True)