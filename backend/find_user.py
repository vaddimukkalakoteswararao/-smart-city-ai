from database.connection import SessionLocal
from models.user import User


db = SessionLocal()

try:
    users = (
        db.query(User)
        .order_by(User.id.asc())
        .all()
    )

    if not users:
        print("No users found.")

    else:
        print()
        print("ALL USER ACCOUNTS")
        print("=" * 60)

        for user in users:
            print(
                f"ID: {user.id} | "
                f"Email: {user.email} | "
                f"Name: {user.full_name} | "
                f"Role: {user.role} | "
                f"Department: {user.department}"
            )

finally:
    db.close()