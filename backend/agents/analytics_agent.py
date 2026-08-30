from __future__ import annotations

from collections import Counter
from datetime import datetime
from typing import Any


# =========================================================
# HELPERS
# =========================================================

def _get_value(
    complaint: Any,
    field: str,
    default: Any = None,
) -> Any:
    """
    Read a field from either a SQLAlchemy model object
    or a dictionary.
    """

    if isinstance(complaint, dict):
        return complaint.get(field, default)

    return getattr(
        complaint,
        field,
        default,
    )


# =========================================================
# ANALYTICS AGENT
# =========================================================

def generate_analytics(
    complaints: list[Any],
) -> dict[str, Any]:
    """
    Generate dashboard analytics from complaint records.
    """

    total = len(complaints)

    # -----------------------------------------------------
    # Counters
    # -----------------------------------------------------

    category_counter = Counter()
    department_counter = Counter()
    priority_counter = Counter()
    status_counter = Counter()

    # -----------------------------------------------------
    # Process complaints
    # -----------------------------------------------------

    for complaint in complaints:

        category = _get_value(
            complaint,
            "category",
            "Unknown",
        )

        department = _get_value(
            complaint,
            "department",
            "Unknown",
        )

        priority = _get_value(
            complaint,
            "priority",
            "Unknown",
        )

        status = _get_value(
            complaint,
            "status",
            "Unknown",
        )

        category_counter[str(category)] += 1
        department_counter[str(department)] += 1
        priority_counter[str(priority)] += 1
        status_counter[str(status)] += 1

    # -----------------------------------------------------
    # Resolution statistics
    # -----------------------------------------------------

    resolved_count = status_counter.get(
        "Resolved",
        0,
    )

    submitted_count = status_counter.get(
        "Submitted",
        0,
    )

    in_progress_count = status_counter.get(
        "In Progress",
        0,
    )

    resolution_rate = 0.0

    if total > 0:
        resolution_rate = (
            resolved_count / total
        ) * 100

    # -----------------------------------------------------
    # Recent complaints
    # -----------------------------------------------------

    recent_complaints = []

    sorted_complaints = sorted(
        complaints,
        key=lambda item: (
            _get_value(
                item,
                "created_at",
                datetime.min,
            )
            or datetime.min
        ),
        reverse=True,
    )

    for complaint in sorted_complaints[:5]:

        recent_complaints.append(
            {
                "complaint_id": _get_value(
                    complaint,
                    "complaint_id",
                ),
                "category": _get_value(
                    complaint,
                    "category",
                ),
                "priority": _get_value(
                    complaint,
                    "priority",
                ),
                "department": _get_value(
                    complaint,
                    "department",
                ),
                "status": _get_value(
                    complaint,
                    "status",
                ),
                "created_at": _get_value(
                    complaint,
                    "created_at",
                ),
            }
        )

    # -----------------------------------------------------
    # Highest workload department
    # -----------------------------------------------------

    top_department = None

    if department_counter:
        top_department = (
            department_counter.most_common(1)[0][0]
        )

    # -----------------------------------------------------
    # Most common issue
    # -----------------------------------------------------

    top_category = None

    if category_counter:
        top_category = (
            category_counter.most_common(1)[0][0]
        )

    # -----------------------------------------------------
    # Build response
    # -----------------------------------------------------

    return {
        "success": True,

        "summary": {
            "total_complaints": total,
            "resolved_complaints": resolved_count,
            "submitted_complaints": submitted_count,
            "in_progress_complaints":
                in_progress_count,
            "resolution_rate":
                round(resolution_rate, 2),
            "most_common_issue":
                top_category,
            "highest_workload_department":
                top_department,
        },

        "by_category": dict(
            category_counter
        ),

        "by_department": dict(
            department_counter
        ),

        "by_priority": dict(
            priority_counter
        ),

        "by_status": dict(
            status_counter
        ),

        "recent_complaints":
            recent_complaints,
    }


# =========================================================
# SIMPLE TEXT SUMMARY
# =========================================================

def generate_analytics_summary(
    complaints: list[Any],
) -> str:
    """
    Create a human-readable analytics summary.
    """

    analytics = generate_analytics(
        complaints
    )

    summary = analytics["summary"]

    return (
        "Smart City Analytics: "
        f"{summary['total_complaints']} total complaints, "
        f"{summary['resolved_complaints']} resolved, "
        f"{summary['submitted_complaints']} submitted, "
        f"resolution rate "
        f"{summary['resolution_rate']}%. "
        f"Most common issue: "
        f"{summary['most_common_issue'] or 'None'}. "
        f"Highest workload department: "
        f"{summary['highest_workload_department'] or 'None'}."
    )
