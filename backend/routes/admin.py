from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from agents.analytics_agent import generate_analytics
from agents.classification_agent import classify_complaint
from agents.reply_agent import generate_reply

from database.connection import get_db

from models.complaint import Complaint
from models.complaint_history import ComplaintHistory
from models.user import User

from routes.auth import get_authenticated_user


router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
)


# =========================================================
# CONSTANTS
# =========================================================

ALLOWED_STATUSES = {
    "Submitted",
    "In Progress",
    "Resolved",
    "Rejected",
}


DEPARTMENTS = [
    "Sanitation Department",
    "Roads and Infrastructure Department",
    "Water Supply Department",
    "Electrical Department",
    "Municipal General Services",
]


# =========================================================
# HELPERS
# =========================================================

def require_staff(
    current_user: User,
):
    if current_user.role not in {
        "admin",
        "officer",
    }:
        raise HTTPException(
            status_code=403,
            detail="Staff access required.",
        )


def can_access_complaint(
    current_user: User,
    complaint: Complaint,
):
    if current_user.role == "admin":
        return True

    if current_user.role == "officer":
        return (
            complaint.department
            == current_user.department
        )

    return False


# =========================================================
# DASHBOARD SUMMARY
# =========================================================

@router.get("/summary")
def get_admin_summary(
    current_user: User = Depends(
        get_authenticated_user
    ),
    db: Session = Depends(get_db),
):
    require_staff(current_user)

    query = db.query(Complaint)

    if current_user.role == "officer":
        query = query.filter(
            Complaint.department
            == current_user.department
        )

    complaints = query.all()

    total_complaints = len(complaints)

    high_priority = sum(
        1
        for complaint in complaints
        if complaint.priority == "High"
    )

    in_progress = sum(
        1
        for complaint in complaints
        if complaint.status == "In Progress"
    )

    resolved = sum(
        1
        for complaint in complaints
        if complaint.status == "Resolved"
    )

    submitted = sum(
        1
        for complaint in complaints
        if complaint.status == "Submitted"
    )

    rejected = sum(
        1
        for complaint in complaints
        if complaint.status == "Rejected"
    )

    department_counts = {}

    for complaint in complaints:
        department = (
            complaint.department
            or "Unassigned"
        )

        department_counts[department] = (
            department_counts.get(
                department,
                0,
            )
            + 1
        )

    return {
        "total_complaints":
            total_complaints,

        "high_priority":
            high_priority,

        "in_progress":
            in_progress,

        "resolved":
            resolved,

        "submitted":
            submitted,

        "rejected":
            rejected,

        "department_counts":
            department_counts,
    }


# =========================================================
# AI ANALYTICS
# =========================================================

@router.get("/analytics")
def get_admin_analytics(
    current_user: User = Depends(
        get_authenticated_user
    ),
    db: Session = Depends(get_db),
):
    """
    Generate detailed analytics using the
    Smart City Analytics Agent.
    """

    require_staff(current_user)

    query = db.query(Complaint)

    # Officers only see their department.
    if current_user.role == "officer":
        query = query.filter(
            Complaint.department
            == current_user.department
        )

    complaints = (
        query
        .order_by(
            Complaint.created_at.desc()
        )
        .all()
    )

    analytics = generate_analytics(
        complaints
    )

    return analytics


# =========================================================
# MAP DATA
# =========================================================

@router.get("/map")
def get_complaint_map(
    current_user: User = Depends(
        get_authenticated_user
    ),
    db: Session = Depends(get_db),
):
    require_staff(current_user)

    query = db.query(Complaint)

    if current_user.role == "officer":
        query = query.filter(
            Complaint.department
            == current_user.department
        )

    complaints = (
        query
        .filter(
            Complaint.latitude.isnot(None),
            Complaint.longitude.isnot(None),
        )
        .order_by(
            Complaint.created_at.desc()
        )
        .all()
    )

    return [
        {
            "complaint_id":
                complaint.complaint_id,

            "category":
                complaint.category,

            "priority":
                complaint.priority,

            "department":
                complaint.department,

            "status":
                complaint.status,

            "latitude":
                complaint.latitude,

            "longitude":
                complaint.longitude,

            "location":
                complaint.location_text,
        }
        for complaint in complaints
    ]


# =========================================================
# GET ALL COMPLAINTS
# =========================================================

@router.get("/complaints")
def get_all_complaints(
    department: str | None = Query(
        default=None
    ),
    status: str | None = Query(
        default=None
    ),
    priority: str | None = Query(
        default=None
    ),
    current_user: User = Depends(
        get_authenticated_user
    ),
    db: Session = Depends(get_db),
):
    require_staff(current_user)

    query = db.query(Complaint)

    if current_user.role == "officer":

        query = query.filter(
            Complaint.department
            == current_user.department
        )

    elif (
        department
        and department != "All"
    ):

        query = query.filter(
            Complaint.department
            == department
        )

    if (
        status
        and status != "All"
    ):

        query = query.filter(
            Complaint.status == status
        )

    if (
        priority
        and priority != "All"
    ):

        query = query.filter(
            Complaint.priority == priority
        )

    return (
        query
        .order_by(
            Complaint.created_at.desc()
        )
        .all()
    )


# =========================================================
# GET ONE COMPLAINT
# =========================================================

@router.get("/complaints/{complaint_id}")
def get_complaint(
    complaint_id: str,
    current_user: User = Depends(
        get_authenticated_user
    ),
    db: Session = Depends(get_db),
):
    require_staff(current_user)

    complaint = (
        db.query(Complaint)
        .filter(
            Complaint.complaint_id
            == complaint_id
        )
        .first()
    )

    if complaint is None:
        raise HTTPException(
            status_code=404,
            detail="Complaint not found.",
        )

    if not can_access_complaint(
        current_user,
        complaint,
    ):
        raise HTTPException(
            status_code=403,
            detail=(
                "You are not authorized "
                "to access this complaint."
            ),
        )

    return complaint


# =========================================================
# COMPLAINT HISTORY
# =========================================================

@router.get(
    "/complaints/{complaint_id}/history"
)
def get_complaint_history(
    complaint_id: str,
    current_user: User = Depends(
        get_authenticated_user
    ),
    db: Session = Depends(get_db),
):
    require_staff(current_user)

    complaint = (
        db.query(Complaint)
        .filter(
            Complaint.complaint_id
            == complaint_id
        )
        .first()
    )

    if complaint is None:
        raise HTTPException(
            status_code=404,
            detail="Complaint not found.",
        )

    if not can_access_complaint(
        current_user,
        complaint,
    ):
        raise HTTPException(
            status_code=403,
            detail=(
                "You are not authorized "
                "to view this complaint history."
            ),
        )

    history = (
        db.query(ComplaintHistory)
        .filter(
            ComplaintHistory.complaint_id
            == complaint_id
        )
        .order_by(
            ComplaintHistory.created_at.asc()
        )
        .all()
    )

    return history


# =========================================================
# UPDATE STATUS + AUDIT HISTORY
# =========================================================

@router.put(
    "/complaints/{complaint_id}/status"
)
def update_complaint_status(
    complaint_id: str,
    status: str,
    current_user: User = Depends(
        get_authenticated_user
    ),
    db: Session = Depends(get_db),
):
    require_staff(current_user)

    if status not in ALLOWED_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid status. "
                "Allowed values: "
                + ", ".join(
                    sorted(
                        ALLOWED_STATUSES
                    )
                )
            ),
        )

    complaint = (
        db.query(Complaint)
        .filter(
            Complaint.complaint_id
            == complaint_id
        )
        .first()
    )

    if complaint is None:
        raise HTTPException(
            status_code=404,
            detail="Complaint not found.",
        )

    if not can_access_complaint(
        current_user,
        complaint,
    ):
        raise HTTPException(
            status_code=403,
            detail=(
                "You cannot modify complaints "
                "outside your department."
            ),
        )

    old_status = complaint.status

    if old_status == status:
        return {
            "success": True,
            "message": (
                "Complaint status is already "
                "set to this value."
            ),
            "complaint_id":
                complaint.complaint_id,
            "status":
                complaint.status,
        }

    complaint.status = status

    history = ComplaintHistory(
        complaint_id=
            complaint.complaint_id,

        old_status=
            old_status,

        new_status=
            status,

        changed_by_user_id=
            current_user.id,

        changed_by_email=
            current_user.email,

        changed_by_name=
            current_user.full_name,
    )

    db.add(history)

    db.commit()

    db.refresh(complaint)

    return {
        "success": True,

        "message":
            "Complaint status updated.",

        "complaint_id":
            complaint.complaint_id,

        "old_status":
            old_status,

        "new_status":
            complaint.status,

        "changed_by":
            current_user.full_name,
    }


# =========================================================
# RECLASSIFY ONE COMPLAINT
# =========================================================

@router.post(
    "/complaints/{complaint_id}/reclassify"
)
def reclassify_complaint(
    complaint_id: str,
    current_user: User = Depends(
        get_authenticated_user
    ),
    db: Session = Depends(get_db),
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail=(
                "Administrator access required."
            ),
        )

    complaint = (
        db.query(Complaint)
        .filter(
            Complaint.complaint_id
            == complaint_id
        )
        .first()
    )

    if complaint is None:
        raise HTTPException(
            status_code=404,
            detail="Complaint not found.",
        )

    ai_result = classify_complaint(
        complaint.description
    )

    complaint.category = (
        ai_result["category"]
    )

    complaint.priority = (
        ai_result["priority"]
    )

    complaint.department = (
        ai_result["department"]
    )

    complaint.ai_summary = (
        complaint.description
    )

    complaint.ai_response = generate_reply(
        complaint_description=
            complaint.description,

        category=
            complaint.category,

        priority=
            complaint.priority,

        department=
            complaint.department,

        complaint_id=
            complaint.complaint_id,
    )

    db.commit()

    db.refresh(complaint)

    return {
        "success": True,

        "message":
            "Complaint reclassified successfully.",

        "complaint_id":
            complaint.complaint_id,

        "category":
            complaint.category,

        "priority":
            complaint.priority,

        "department":
            complaint.department,

        "status":
            complaint.status,

        "ai_response":
            complaint.ai_response,
    }


# =========================================================
# RECLASSIFY ALL
# =========================================================

@router.post(
    "/complaints/reclassify-all"
)
def reclassify_all_complaints(
    current_user: User = Depends(
        get_authenticated_user
    ),
    db: Session = Depends(get_db),
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail=(
                "Administrator access required."
            ),
        )

    complaints = (
        db.query(Complaint)
        .all()
    )

    updated = 0

    for complaint in complaints:

        ai_result = classify_complaint(
            complaint.description
        )

        complaint.category = (
            ai_result["category"]
        )

        complaint.priority = (
            ai_result["priority"]
        )

        complaint.department = (
            ai_result["department"]
        )

        complaint.ai_summary = (
            complaint.description
        )

        complaint.ai_response = generate_reply(
            complaint_description=
                complaint.description,

            category=
                complaint.category,

            priority=
                complaint.priority,

            department=
                complaint.department,

            complaint_id=
                complaint.complaint_id,
        )

        updated += 1

    db.commit()

    return {
        "success": True,

        "message":
            "All existing complaints were reclassified.",

        "updated_count":
            updated,
    }


# =========================================================
# DEPARTMENTS
# =========================================================

@router.get("/departments")
def get_departments(
    current_user: User = Depends(
        get_authenticated_user
    ),
):
    require_staff(current_user)

    return {
        "departments":
            DEPARTMENTS
    }