from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String

from database.connection import Base


class User(Base):
    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    email = Column(
        String(150),
        unique=True,
        index=True,
        nullable=False,
    )

    password_hash = Column(
        String(255),
        nullable=False,
    )

    role = Column(
        String(30),
        nullable=False,
        default="citizen",
    )

    department = Column(
        String(100),
        nullable=True,
    )

    full_name = Column(
        String(100),
        nullable=False,
    )

    is_active = Column(
        Integer,
        nullable=False,
        default=1,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )