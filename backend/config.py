# config.py - All configuration settings for the Flask app
# Think of this as the "settings panel" for the entire backend

import os
from datetime import timedelta

# ------------------------------------------------------------
# Base directory - the folder where this file lives
# ------------------------------------------------------------
BASE_DIR = os.path.abspath(os.path.dirname(__file__))


class Config:
    # ------------------------------------------------------------
    # SECRET KEY - used to sign cookies and JWT tokens
    # Change this to a long random string in production!
    # ------------------------------------------------------------
    SECRET_KEY = os.environ.get("SECRET_KEY", "super-secret-key-change-in-production")

    # ------------------------------------------------------------
    # DATABASE CONFIGURATION
    # Format: mysql+pymysql://username:password@host:port/database_name
    # Update with YOUR MySQL credentials before running the app
    # ------------------------------------------------------------
    MYSQL_USER     = os.environ.get("MYSQL_USER", "root")
    MYSQL_PASSWORD = os.environ.get("MYSQL_PASSWORD", "Niku%401991D")
    MYSQL_HOST     = os.environ.get("MYSQL_HOST", "localhost")
    MYSQL_PORT     = os.environ.get("MYSQL_PORT", "3306")
    MYSQL_DB       = os.environ.get("MYSQL_DB", "smart_dms")

    SQLALCHEMY_DATABASE_URI = (
        f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}"
        f"@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}?ssl=true"
    )

    # Disable modification tracking (saves memory, not needed)
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # ------------------------------------------------------------
    # FILE UPLOAD CONFIGURATION
    # ------------------------------------------------------------
    # Folder where uploaded files will be stored on disk
    UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")

    # Maximum file size allowed: 16 MB
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB in bytes

    # Allowed file extensions (only these types can be uploaded)
    ALLOWED_EXTENSIONS = {"pdf", "doc", "docx", "txt", "png", "jpg", "jpeg", "gif", "webp"}

    # ------------------------------------------------------------
    # JWT (JSON Web Token) CONFIGURATION
    # JWT is used to keep users logged in securely
    # ------------------------------------------------------------
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "jwt-secret-key-change-in-production")

    # Token expires after 1 day — user must log in again after this
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=1)


# ------------------------------------------------------------
# Helper function: check if a filename has an allowed extension
# Usage: allowed_file("resume.pdf") → True
#        allowed_file("virus.exe")  → False
# ------------------------------------------------------------
def allowed_file(filename):
    return (
        "." in filename and
        filename.rsplit(".", 1)[1].lower() in Config.ALLOWED_EXTENSIONS
    )