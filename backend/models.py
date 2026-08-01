# models.py - Database Models (Tables)
# Each class here = one table in MySQL
# SQLAlchemy lets us work with tables as Python objects instead of writing raw SQL

from datetime import datetime
from extensions import db  # we'll create extensions.py next to avoid circular imports
from werkzeug.security import generate_password_hash, check_password_hash


# ============================================================
# USER TABLE
# Stores all registered users
# ============================================================
class User(db.Model):
    __tablename__ = "users"  # actual table name in MySQL

    # --- Columns ---
    id         = db.Column(db.Integer, primary_key=True)           # auto-increment ID
    username   = db.Column(db.String(80),  unique=True, nullable=False)  # must be unique
    email      = db.Column(db.String(120), unique=True, nullable=False)  # must be unique
    password   = db.Column(db.String(256), nullable=False)         # hashed password
    created_at = db.Column(db.DateTime, default=datetime.utcnow)   # signup timestamp

    # --- Relationship ---
    # One user can have MANY documents
    # "cascade delete" = if user is deleted, their documents are deleted too
    documents = db.relationship(
        "Document",
        backref="owner",       # lets us do document.owner to get the user
        lazy=True,
        cascade="all, delete-orphan"
    )

    # --- Password helpers ---
    def set_password(self, raw_password):
        """Hash the password before saving to DB — never store plain text!"""
        self.password = generate_password_hash(raw_password)

    def check_password(self, raw_password):
        """Check if the entered password matches the stored hash"""
        return check_password_hash(self.password, raw_password)

    def to_dict(self):
        """Convert user object to a plain dictionary (for JSON responses)"""
        return {
            "id":         self.id,
            "username":   self.username,
            "email":      self.email,
            "created_at": self.created_at.isoformat()
        }

    def __repr__(self):
        return f"<User {self.username}>"


# ============================================================
# DOCUMENT TABLE
# Stores metadata about each uploaded file
# The actual file bytes are stored in file_data (DB-backed, persists
# across Render restarts) — the /uploads folder copy is temporary
# and only used as a scratch file during the request.
# ============================================================
class Document(db.Model):
    __tablename__ = "documents"  # actual table name in MySQL

    # --- Columns ---
    id            = db.Column(db.Integer, primary_key=True)

    # Original filename as uploaded by user (e.g. "my_resume.pdf")
    original_name = db.Column(db.String(255), nullable=False)

    # Saved filename on disk (UUID-based to avoid collisions, e.g. "a1b2c3.pdf")
    stored_name   = db.Column(db.String(255), nullable=False, unique=True)

    # File type/extension (e.g. "pdf", "jpg", "docx")
    file_type     = db.Column(db.String(50),  nullable=False)

    # File size in bytes
    file_size     = db.Column(db.Integer,     nullable=False)

    # Actual file bytes, stored in the DB (LONGBLOB) so downloads survive
    # Render's ephemeral disk. Nullable so old rows without data don't break.
    file_data     = db.Column(db.LargeBinary(length=(2**32) - 1), nullable=True)

    # Optional description the user can provide
    description   = db.Column(db.String(500), nullable=True)

    # When the file was uploaded
    uploaded_at   = db.Column(db.DateTime, default=datetime.utcnow)

    # Foreign key — links this document to a user
    user_id       = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    def to_dict(self):
        """Convert document object to a plain dictionary (for JSON responses)"""
        return {
            "id":            self.id,
            "original_name": self.original_name,
            "stored_name":   self.stored_name,
            "file_type":     self.file_type,
            "file_size":     self.file_size,
            "file_size_kb":  round(self.file_size / 1024, 2),   # size in KB
            "description":   self.description,
            "uploaded_at":   self.uploaded_at.isoformat(),
            "user_id":       self.user_id
        }

    def __repr__(self):
        return f"<Document {self.original_name}>"