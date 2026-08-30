from database.connection import SessionLocal
from models.complaint import Complaint
from agents.analytics_agent import (
    generate_analytics,
    generate_analytics_summary,
)


db = SessionLocal()

try:
    complaints = (
        db.query(Complaint)
        .order_by(
            Complaint.created_at.desc()
        )
        .all()
    )

    print()
    print("SMART CITY ANALYTICS TEST")
    print("=" * 50)

    analytics = generate_analytics(
        complaints
    )

    print()
    print("Summary:")
    print(
        analytics["summary"]
    )

    print()
    print("By Category:")
    print(
        analytics["by_category"]
    )

    print()
    print("By Department:")
    print(
        analytics["by_department"]
    )

    print()
    print("By Priority:")
    print(
        analytics["by_priority"]
    )

    print()
    print("By Status:")
    print(
        analytics["by_status"]
    )

    print()
    print("Recent Complaints:")
    print(
        analytics["recent_complaints"]
    )

    print()
    print("Human-readable summary:")
    print(
        generate_analytics_summary(
            complaints
        )
    )

finally:
    db.close()