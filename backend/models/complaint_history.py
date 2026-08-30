from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String

from database.connection import Base


class ComplaintHistory(Base):
    __tablename__ = "complaint_history"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    complaint_id = Column(
        String(50),
        ForeignKey(
            "complaints.complaint_id"
        ),
        nullable=False,
        index=True,
    )

    old_status = Column(
        String(50),
        nullable=True,
    )

    new_status = Column(
        String(50),
        nullable=False,
    )

    changed_by_user_id = Column(
        Integer,
        nullable=True,
    )

    changed_by_email = Column(
        String(150),
        nullable=False,
    )

    changed_by_name = Column(
        String(100),
        nullable=False,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )
