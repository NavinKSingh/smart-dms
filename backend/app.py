# app.py - Main Flask Application Entry Point
# This is the "heart" of the backend — it wires everything together:
# config, database, JWT, blueprints (auth + documents), and CORS

import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from config import Config
from extensions import db, jwt


# ============================================================
# APP FACTORY FUNCTION
# Creates and configures the Flask app
# Using a factory function is best practice — easier to test
# ============================================================
def create_app():
    app = Flask(__name__)

    # --- Load all config settings from config.py ---
    app.config.from_object(Config)

    # ------------------------------------------------------------
    # CORS - Cross Origin Resource Sharing
    # Allows the React frontend (localhost:3000) to call our API
    # Without this, browsers will BLOCK all frontend → backend calls
    # ------------------------------------------------------------
    CORS(
    app,
    resources={r"/api/*": {"origins": "*"}},
    supports_credentials=True
    )

    # ------------------------------------------------------------
    # INITIALIZE EXTENSIONS
    # We call init_app() here to "attach" db and jwt to our app
    # They were created in extensions.py without the app object
    # ------------------------------------------------------------
    db.init_app(app)
    jwt.init_app(app)

    # ------------------------------------------------------------
    # REGISTER BLUEPRINTS
    # Each blueprint is a group of related routes
    # url_prefix means all routes in auth_bp start with /api/auth
    # ------------------------------------------------------------
    from auth import auth_bp
    from documents import docs_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(docs_bp, url_prefix="/api/documents")

    # ------------------------------------------------------------
    # CREATE DATABASE TABLES
    # db.create_all() reads all our models and creates the tables
    # in MySQL if they don't already exist (safe to run multiple times)
    # ------------------------------------------------------------
    with app.app_context():
        db.create_all()
        print("✅ Database tables created/verified successfully!")

        # Create uploads folder if it doesn't exist
        os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
        print(f"✅ Upload folder ready at: {app.config['UPLOAD_FOLDER']}")

    # ------------------------------------------------------------
    # JWT ERROR HANDLERS
    # Custom error messages when JWT token is missing or invalid
    # ------------------------------------------------------------
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({
            "error":   "Authorization token is missing",
            "message": "Please log in to access this resource"
        }), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({
            "error":   "Invalid token",
            "message": "Please log in again"
        }), 401

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({
            "error":   "Token has expired",
            "message": "Please log in again"
        }), 401

    # ------------------------------------------------------------
    # GLOBAL ERROR HANDLERS
    # Catch common HTTP errors and return clean JSON responses
    # ------------------------------------------------------------
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": "Resource not found"}), 404

    @app.errorhandler(405)
    def method_not_allowed(error):
        return jsonify({"error": "Method not allowed"}), 405

    @app.errorhandler(413)
    def file_too_large(error):
        return jsonify({"error": "File too large. Maximum size is 16MB"}), 413

    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()   # rollback any failed DB transaction
        return jsonify({"error": "Internal server error"}), 500

    # ------------------------------------------------------------
    # HEALTH CHECK ROUTE
    # GET /api/health
    # Quick way to verify the backend is running
    # ------------------------------------------------------------
    @app.route("/api/health", methods=["GET"])
    def health_check():
        return jsonify({
            "status":  "healthy",
            "message": "Smart DMS API is running!",
            "version": "1.0.0"
        }), 200

    # ------------------------------------------------------------
    # ROOT ROUTE
    # GET /
    # ------------------------------------------------------------
    @app.route("/", methods=["GET"])
    def root():
        return jsonify({
            "message": "Welcome to Smart DMS API",
            "docs":    "Use /api/health to check status"
        }), 200

    return app


# ============================================================
# RUN THE APP
# This block only runs when you execute: python app.py
# In production you'd use: gunicorn app:app
# ============================================================
if __name__ == "__main__":
    app = create_app()

    print("\n" + "="*50)
    print("🚀 Smart DMS Backend Starting...")
    print("="*50)
    print("📡 API running at:  http://localhost:5000")
    print("🔍 Health check:    http://localhost:5000/api/health")
    print("="*50 + "\n")

    app.run(
        host="0.0.0.0",   # accept connections from any IP
        port=5000,
        debug=True        # auto-reloads on code changes (disable in production!)
    )