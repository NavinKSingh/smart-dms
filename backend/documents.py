# documents.py - Document Management Routes
# Handles: Upload, List, Download, Delete, Search, Preview
# All routes here start with /api/documents/...

import os
import uuid                          # generates unique filenames
from flask import (
    Blueprint, request, jsonify,
    send_from_directory, current_app  # current_app gives access to app config
)
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename  # sanitizes filenames for safety
from extensions import db
from models import Document, User
from config import allowed_file      # our helper that checks file extensions

# ------------------------------------------------------------
# Blueprint for all document-related routes
# Registered in app.py with prefix /api/documents
# ------------------------------------------------------------
docs_bp = Blueprint("documents", __name__)


# ============================================================
# UPLOAD FILE
# POST /api/documents/upload
# Form data: file (binary), description (optional text)
# Header: Authorization: Bearer <token>
# ============================================================
@docs_bp.route("/upload", methods=["POST"])
@jwt_required()  # 🔒 Must be logged in
def upload_file():
    user_id = get_jwt_identity()

    # --- Check a file was actually sent ---
    if "file" not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files["file"]

    # Empty filename means no file was selected
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    # --- Validate file extension ---
    if not allowed_file(file.filename):
        return jsonify({
            "error": "File type not allowed. Supported: PDF, DOC, DOCX, TXT, PNG, JPG, JPEG, GIF, WEBP"
        }), 400

    # --- Create a safe, unique filename ---
    # secure_filename("my resume (1).pdf") → "my_resume_1_.pdf"
    original_name  = file.filename
    safe_name      = secure_filename(original_name)
    extension      = safe_name.rsplit(".", 1)[1].lower()

    # Use UUID to avoid filename collisions on disk
    # e.g. "a3f8c2d1-4b5e-4f6a-8c9d-0e1f2a3b4c5d.pdf"
    unique_name    = f"{uuid.uuid4()}.{extension}"

    # --- Ensure uploads folder exists ---
    upload_folder = current_app.config["UPLOAD_FOLDER"]
    os.makedirs(upload_folder, exist_ok=True)

    # --- Save the file to disk ---
    file_path = os.path.join(upload_folder, unique_name)
    file.save(file_path)

    # --- Get file size in bytes ---
    file_size = os.path.getsize(file_path)

    # --- Optional description from form data ---
    description = request.form.get("description", "").strip()

    # --- Save file metadata to the database ---
    new_doc = Document(
        original_name = original_name,
        stored_name   = unique_name,
        file_type     = extension,
        file_size     = file_size,
        description   = description if description else None,
        user_id       = int(user_id)
    )

    db.session.add(new_doc)
    db.session.commit()

    return jsonify({
        "message":  "File uploaded successfully!",
        "document": new_doc.to_dict()
    }), 201


# ============================================================
# LIST ALL DOCUMENTS (for the logged-in user)
# GET /api/documents/
# Header: Authorization: Bearer <token>
# ============================================================
@docs_bp.route("/", methods=["GET"])
@jwt_required()  # 🔒 Must be logged in
def list_documents():
    user_id = get_jwt_identity()

    # Fetch all documents belonging to this user, newest first
    documents = (
        Document.query
        .filter_by(user_id=int(user_id))
        .order_by(Document.uploaded_at.desc())
        .all()
    )

    return jsonify({
        "documents": [doc.to_dict() for doc in documents],
        "total":     len(documents)
    }), 200


# ============================================================
# SEARCH DOCUMENTS
# GET /api/documents/search?q=resume
# Header: Authorization: Bearer <token>
# ============================================================
@docs_bp.route("/search", methods=["GET"])
@jwt_required()  # 🔒 Must be logged in
def search_documents():
    user_id = get_jwt_identity()

    # Get the search query from URL params (?q=...)
    query = request.args.get("q", "").strip()

    if not query:
        return jsonify({"error": "Search query is required"}), 400

    # Search in both filename and description using SQL LIKE
    # % is a wildcard — %resume% matches "my_resume.pdf", "resume_2024", etc.
    search_term = f"%{query}%"

    results = (
        Document.query
        .filter_by(user_id=int(user_id))
        .filter(
            db.or_(
                Document.original_name.ilike(search_term),   # search by filename
                Document.description.ilike(search_term),     # search by description
                Document.file_type.ilike(search_term)        # search by file type
            )
        )
        .order_by(Document.uploaded_at.desc())
        .all()
    )

    return jsonify({
        "documents": [doc.to_dict() for doc in results],
        "total":     len(results),
        "query":     query
    }), 200


# ============================================================
# GET SINGLE DOCUMENT METADATA
# GET /api/documents/<doc_id>
# Header: Authorization: Bearer <token>
# ============================================================
@docs_bp.route("/<int:doc_id>", methods=["GET"])
@jwt_required()  # 🔒 Must be logged in
def get_document(doc_id):
    user_id = get_jwt_identity()

    # Find document by ID AND user_id (security: users can only see their own files)
    doc = Document.query.filter_by(id=doc_id, user_id=int(user_id)).first()

    if not doc:
        return jsonify({"error": "Document not found"}), 404

    return jsonify({"document": doc.to_dict()}), 200


# ============================================================
# DOWNLOAD / VIEW FILE
# GET /api/documents/<doc_id>/download
# Header: Authorization: Bearer <token>
# ============================================================
@docs_bp.route("/<int:doc_id>/download", methods=["GET"])
@jwt_required()  # 🔒 Must be logged in
def download_file(doc_id):
    user_id = get_jwt_identity()

    # Verify document belongs to this user
    doc = Document.query.filter_by(id=doc_id, user_id=int(user_id)).first()

    if not doc:
        return jsonify({"error": "Document not found"}), 404

    upload_folder = current_app.config["UPLOAD_FOLDER"]

    # Check the file actually exists on disk
    file_path = os.path.join(upload_folder, doc.stored_name)
    if not os.path.exists(file_path):
        return jsonify({"error": "File not found on server"}), 404

    # as_attachment=False → opens in browser (for preview)
    # as_attachment=True  → forces download
    as_attachment = request.args.get("download", "false").lower() == "true"

    return send_from_directory(
        upload_folder,
        doc.stored_name,
        as_attachment   = as_attachment,
        download_name   = doc.original_name  # use original name when downloading
    )


# ============================================================
# DELETE DOCUMENT
# DELETE /api/documents/<doc_id>
# Header: Authorization: Bearer <token>
# ============================================================
@docs_bp.route("/<int:doc_id>", methods=["DELETE"])
@jwt_required()  # 🔒 Must be logged in
def delete_document(doc_id):
    user_id = get_jwt_identity()

    # Verify document belongs to this user
    doc = Document.query.filter_by(id=doc_id, user_id=int(user_id)).first()

    if not doc:
        return jsonify({"error": "Document not found"}), 404

    # --- Delete the actual file from disk ---
    upload_folder = current_app.config["UPLOAD_FOLDER"]
    file_path     = os.path.join(upload_folder, doc.stored_name)

    if os.path.exists(file_path):
        os.remove(file_path)  # delete from disk

    # --- Delete the record from the database ---
    db.session.delete(doc)
    db.session.commit()

    return jsonify({"message": "Document deleted successfully!"}), 200


# ============================================================
# UPDATE DOCUMENT DESCRIPTION
# PUT /api/documents/<doc_id>
# Body: { "description": "..." }
# Header: Authorization: Bearer <token>
# ============================================================
@docs_bp.route("/<int:doc_id>", methods=["PUT"])
@jwt_required()  # 🔒 Must be logged in
def update_document(doc_id):
    user_id = get_jwt_identity()

    doc = Document.query.filter_by(id=doc_id, user_id=int(user_id)).first()

    if not doc:
        return jsonify({"error": "Document not found"}), 404

    data        = request.get_json()
    description = data.get("description", "").strip()

    # Update description
    doc.description = description if description else None
    db.session.commit()

    return jsonify({
        "message":  "Document updated successfully!",
        "document": doc.to_dict()
    }), 200


# ============================================================
# GET STORAGE STATS (for dashboard summary cards)
# GET /api/documents/stats
# Header: Authorization: Bearer <token>
# ============================================================
@docs_bp.route("/stats", methods=["GET"])
@jwt_required()  # 🔒 Must be logged in
def get_stats():
    user_id = get_jwt_identity()

    # All documents for this user
    docs = Document.query.filter_by(user_id=int(user_id)).all()

    total_files = len(docs)
    total_size  = sum(d.file_size for d in docs)  # total bytes

    # Count by file type
    type_counts = {}
    for doc in docs:
        ft = doc.file_type
        type_counts[ft] = type_counts.get(ft, 0) + 1

    return jsonify({
        "total_files":    total_files,
        "total_size_kb":  round(total_size / 1024, 2),
        "total_size_mb":  round(total_size / (1024 * 1024), 2),
        "by_type":        type_counts
    }), 200