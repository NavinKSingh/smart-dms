# extensions.py - Shared Flask extensions
# We initialize db HERE (not in app.py) so models.py can import
# it without causing circular import errors

from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager

# Create the db object — it gets "attached" to the app later in app.py
db  = SQLAlchemy()
jwt = JWTManager()