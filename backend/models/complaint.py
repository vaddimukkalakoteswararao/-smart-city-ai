from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, String, Text

from database.connection import Base


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)

    complaint_id = Column(
        String(50),
        unique=True,
        index=True,
        nullable=False,
    )

    user_name = Column(String(100), nullable=False)
    email = Column(String(150), nullable=False)
    mobile = Column(String(20), nullable=False)

    category = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)

    image_path = Column(String(255), nullable=True)

    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    location_text = Column(String(255), nullable=True)

    priority = Column(String(30), default="Pending")
    department = Column(String(100), default="Pending")

    status = Column(String(30), default="Submitted")

    ai_summary = Column(Text, nullable=True)
    ai_response = Column(Text, nullable=True)

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )