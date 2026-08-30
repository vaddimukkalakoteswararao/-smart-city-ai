from database.connection import Base, SessionLocal, engine
from models.user import User
from routes.auth import hash_password


Base.metadata.create_all(bind=engine)

db = SessionLocal()


users = [
    {
        "email": "admin@smartcity.ai",
        "password": "Admin@123",
        "full_name": "System Administrator",
        "role": "admin",
        "department": None,
    },
    {
        "email": "roads@smartcity.ai",
        "password": "Roads@123",
        "full_name": "Roads Officer",
        "role": "officer",
        "department": "Roads and Infrastructure Department",
    },
    {
        "email": "sanitation@smartcity.ai",
        "password": "Sanitation@123",
        "full_name": "Sanitation Officer",
        "role": "officer",
        "department": "Sanitation Department",
    },
    {
        "email": "water@smartcity.ai",
        "password": "Water@123",
        "full_name": "Water Supply Officer",
        "role": "officer",
        "department": "Water Supply Department",
    },
    {
        "email": "electrical@smartcity.ai",
        "password": "Electrical@123",
        "full_name": "Electrical Officer",
        "role": "officer",
        "department": "Electrical Department",
    },
]


try:
    for data in users:
        existing = (
            db.query(User)
            .filter(
                User.email == data["email"]
            )
            .first()
        )

        if existing:
            print(
                f"Already exists: {data['email']}"
            )
            continue

        user = User(
            email=data["email"],
            password_hash=hash_password(
                data["password"]
            ),
            full_name=data["full_name"],
            role=data["role"],
            department=data["department"],
            is_active=1,
        )

        db.add(user)

    db.commit()

    print()
    print("User accounts created successfully.")

except Exception as error:
    db.rollback()
    print()
    print(f"Error creating users: {error}")

finally:
    db.close()