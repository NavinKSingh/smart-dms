# auth.py - Authentication Routes
# Handles: Signup, Login, Logout, and Get Current User
# All routes here start with /api/auth/...

from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,   # generates a JWT token after login
    jwt_required,          # decorator to protect routes
    get_jwt_identity,      # gets the logged-in user's ID from the token
    unset_jwt_cookies      # clears JWT cookie on logout
)
from extensions import db
from models import User

# ------------------------------------------------------------
# Blueprint = a mini "app" for grouping related routes
# We register this in app.py with a URL prefix of /api/auth
# ------------------------------------------------------------
auth_bp = Blueprint("auth", __name__)


# ============================================================
# SIGNUP ROUTE
# POST /api/auth/signup
# Body: { "username": "...", "email": "...", "password": "..." }
# ============================================================
@auth_bp.route("/signup", methods=["POST"])
def signup():
    # Get JSON data sent from the frontend
    data = request.get_json()

    # --- Validate required fields ---
    if not data:
        return jsonify({"error": "No data provided"}), 400

    username = data.get("username", "").strip()
    email    = data.get("email", "").strip().lower()
    password = data.get("password", "")

    # Check all fields are present
    if not username or not email or not password:
        return jsonify({"error": "Username, email, and password are required"}), 400

    # Check password length
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    # Check username length
    if len(username) < 3:
        return jsonify({"error": "Username must be at least 3 characters"}), 400

    # --- Check for duplicates in DB ---
    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already taken"}), 409  # 409 = Conflict

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 409

    # --- Create new user ---
    new_user = User(username=username, email=email)
    new_user.set_password(password)  # hashes the password (never store plain text!)

    # Save to database
    db.session.add(new_user)
    db.session.commit()

    # Generate a JWT token so user is logged in immediately after signup
    access_token = create_access_token(identity=str(new_user.id))

    return jsonify({
        "message":      "Account created successfully!",
        "access_token": access_token,
        "user":         new_user.to_dict()
    }), 201  # 201 = Created


# ============================================================
# LOGIN ROUTE
# POST /api/auth/login
# Body: { "email": "...", "password": "..." }
# ============================================================
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    if not data:
        return jsonify({"error": "No data provided"}), 400

    email    = data.get("email", "").strip().lower()
    password = data.get("password", "")

    # Check fields are present
    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    # --- Find user by email ---
    user = User.query.filter_by(email=email).first()

    # Vague error message on purpose — don't reveal if email exists or not
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid email or password"}), 401  # 401 = Unauthorized

    # --- Generate JWT token ---
    # The token contains the user's ID — we use this to identify them on future requests
    access_token = create_access_token(identity=str(user.id))

    return jsonify({
        "message":      "Logged in successfully!",
        "access_token": access_token,
        "user":         user.to_dict()
    }), 200


# ============================================================
# GET CURRENT USER ROUTE
# GET /api/auth/me
# Header: Authorization: Bearer <token>
# Returns the currently logged-in user's info
# ============================================================
@auth_bp.route("/me", methods=["GET"])
@jwt_required()  # 🔒 Protected — must send valid JWT token
def get_current_user():
    # Extract user ID from the JWT token
    user_id = get_jwt_identity()

    # Look up user in the database
    user = User.query.get(int(user_id))

    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({"user": user.to_dict()}), 200


# ============================================================
# LOGOUT ROUTE
# POST /api/auth/logout
# Note: With JWT, logout is mostly handled on the frontend
# by deleting the token. This endpoint is a clean signal.
# ============================================================
@auth_bp.route("/logout", methods=["POST"])
@jwt_required()  # 🔒 Protected
def logout():
    # In a stateless JWT system, the frontend just deletes the token
    # This route exists as a clean API endpoint for the frontend to call
    return jsonify({"message": "Logged out successfully!"}), 200


# ============================================================
# CHANGE PASSWORD ROUTE
# PUT /api/auth/change-password
# Body: { "current_password": "...", "new_password": "..." }
# ============================================================
@auth_bp.route("/change-password", methods=["PUT"])
@jwt_required()  # 🔒 Protected
def change_password():
    user_id = get_jwt_identity()
    user    = User.query.get(int(user_id))

    if not user:
        return jsonify({"error": "User not found"}), 404

    data             = request.get_json()
    current_password = data.get("current_password", "")
    new_password     = data.get("new_password", "")

    # Verify current password
    if not user.check_password(current_password):
        return jsonify({"error": "Current password is incorrect"}), 401

    # Validate new password
    if len(new_password) < 6:
        return jsonify({"error": "New password must be at least 6 characters"}), 400

    # Update password
    user.set_password(new_password)
    db.session.commit()

    return jsonify({"message": "Password changed successfully!"}), 200