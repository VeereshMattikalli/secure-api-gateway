
import argparse
import hashlib
import secrets
import uuid

from app.database.db import Base, engine, SessionLocal
from app.database.models import Client


def generate_client(name, role):

    # Create database tables if they do not exist
    Base.metadata.create_all(bind=engine)

    # Generate a unique client identifier
    client_id = str(uuid.uuid4())

    # Generate a cryptographically secure API key
    api_key = secrets.token_urlsafe(32)

    # Calculate SHA-256 hash
    key_hash = hashlib.sha256(
        api_key.encode("utf-8")
    ).hexdigest()

    db = SessionLocal()

    try:
        client = Client(
            client_id=client_id,
            name=name,
            key_hash=key_hash,
            role=role,
            is_active=True
        )

        db.add(client)
        db.commit()

        print("\n========== CLIENT CREATED ==========")
        print(f"Client Name : {name}")
        print(f"Client ID   : {client_id}")
        print(f"Role        : {role}")
        print(f"API Key     : {api_key}")
        print("====================================")
        print("IMPORTANT: Save this API key securely.")
        print("It will not be stored in plaintext.")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":

    parser = argparse.ArgumentParser(
        description="Generate a new API client"
    )

    parser.add_argument(
        "--name",
        required=True,
        help="Client name"
    )

    parser.add_argument(
        "--role",
        default="USER",
        choices=["USER", "ANALYST", "ADMIN"],
        help="Client role"
    )

    args = parser.parse_args()

    generate_client(args.name, args.role)
