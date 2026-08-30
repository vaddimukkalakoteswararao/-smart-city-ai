from database.connection import SessionLocal
from models.user import User
from routes.auth import hash_password


EMAIL = "chanti04vaddimukkala@gmail.com"
NEW_PASSWORD = "Citizen@123"


db = SessionLocal()

try:
    user = (
        db.query(User)
        .filter(
            User.email == EMAIL
        )
        .first()
    )

    if user is None:
        print(
            f"User not found: {EMAIL}"
        )
    else:
        user.password_hash = hash_password(
            NEW_PASSWORD
        )

        db.commit()

        print()
        print("Password reset successfully.")
        print(f"Email: {EMAIL}")
        print(f"New password: {NEW_PASSWORD}")

finally:
    db.close()