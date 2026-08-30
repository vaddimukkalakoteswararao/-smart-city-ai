import os
import uuid

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
)
from pydantic import BaseModel
from sqlalchemy.orm import Session

from agents.classification_agent import classify_complaint
from agents.email_agent import send_complaint_email
from agents.reply_agent import generate_reply
from agents.vision_agent import analyze_image
from agents.recommendation_agent import generate_recommendation
from agents.chat_agent import generate_chat_response

from database.connection import get_db
from models.complaint import Complaint
from models.user import User

from routes.auth import get_authenticated_user


router = APIRouter(
    prefix="/complaints",
    tags=["Complaints"],
)


# =========================================================
# AI CHAT ASSISTANT
# =========================================================

class ChatRequest(BaseModel):
    message: str


@router.post("/chat")
def complaint_chat(
    payload: ChatRequest,
    current_user: User = Depends(
        get_authenticated_user
    ),
):
    if current_user.role != "citizen":
        raise HTTPException(
            status_code=403,
            detail=(
                "Only citizen accounts can "
                "use the AI assistant."
            ),
        )

    response = generate_chat_response(
        payload.message
    )

    return {
        "success": True,
        "response": response,
    }


# =========================================================
# UPLOAD DIRECTORY
# =========================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

PROJECT_DIR = os.path.dirname(
    BASE_DIR
)

UPLOAD_DIR = os.path.join(
    PROJECT_DIR,
    "uploads",
    "complaints",
)

os.makedirs(
    UPLOAD_DIR,
    exist_ok=True,
)


# =========================================================
# ALLOWED CITIZEN CATEGORIES
# =========================================================

ALLOWED_CATEGORIES = {
    "Garbage Overflow",
    "Pothole / Road Damage",
    "Water Leakage",
    "Damaged Streetlight",
}


# =========================================================
# CREATE COMPLAINT
# =========================================================

@router.post("/")
async def create_complaint(
    user_name: str = Form(...),
    email: str = Form(...),
    mobile: str = Form(...),
    category: str = Form(...),
    description: str = Form(...),
    location_text: str | None = Form(None),
    latitude: float | None = Form(None),
    longitude: float | None = Form(None),
    image: UploadFile | None = File(None),

    current_user: User = Depends(
        get_authenticated_user
    ),

    db: Session = Depends(get_db),
):

    # -----------------------------------------------------
    # Only citizens can submit complaints
    # -----------------------------------------------------

    if current_user.role != "citizen":
        raise HTTPException(
            status_code=403,
            detail=(
                "Only citizen accounts can "
                "submit complaints."
            ),
        )

    # -----------------------------------------------------
    # Never trust identity supplied by browser
    # -----------------------------------------------------

    user_name = current_user.full_name
    email = current_user.email

    # -----------------------------------------------------
    # Validate category
    # -----------------------------------------------------

    if category not in ALLOWED_CATEGORIES:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid civic issue category."
            ),
        )

    # -----------------------------------------------------
    # Generate complaint ID
    # -----------------------------------------------------

    complaint_id = (
        f"CMP-{uuid.uuid4().hex[:8].upper()}"
    )

    # -----------------------------------------------------
    # AI classification
    # -----------------------------------------------------

    ai_result = classify_complaint(
        description
    )

    # -----------------------------------------------------
    # AI response
    # -----------------------------------------------------

    ai_response = generate_reply(
        complaint_description=description,
        category=ai_result["category"],
        priority=ai_result["priority"],
        department=ai_result["department"],
        complaint_id=complaint_id,
    )

    # -----------------------------------------------------
    # Save uploaded image
    # -----------------------------------------------------

    image_path = None

    if image and image.filename:

        extension = os.path.splitext(
            image.filename
        )[1].lower()

        # Keep a simple safe set of image types
        allowed_extensions = {
            ".jpg",
            ".jpeg",
            ".png",
            ".webp",
            ".gif",
        }

        if extension not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Unsupported image format. "
                    "Please upload JPG, JPEG, PNG, "
                    "WEBP, or GIF."
                ),
            )

        filename = (
            f"{complaint_id}{extension}"
        )

        image_path = os.path.join(
            UPLOAD_DIR,
            filename,
        )

        try:
            file_contents = await image.read()

            with open(
                image_path,
                "wb",
            ) as file:
                file.write(
                    file_contents
                )

        except Exception as error:
            print(
                "Image save failed:",
                error,
            )

            raise HTTPException(
                status_code=500,
                detail=(
                    "Unable to save the "
                    "uploaded image."
                ),
            )

    # -----------------------------------------------------
    # COMPUTER VISION ANALYSIS
    # -----------------------------------------------------

    vision_result = {
        "success": False,
        "detected_issue": None,
        "confidence": 0.0,
        "objects": [],
        "message": "No image uploaded.",
    }

    if image_path:
        try:
            vision_result = analyze_image(
                image_path
            )

            print()
            print("Computer Vision Result")
            print("-" * 40)
            print(
                f"Detected Issue: "
                f"{vision_result['detected_issue']}"
            )
            print(
                f"Confidence: "
                f"{vision_result['confidence']}"
            )
            print(
                f"Objects: "
                f"{vision_result['objects']}"
            )
            print(
                f"Message: "
                f"{vision_result['message']}"
            )
            print("-" * 40)

        except Exception as error:
            print(
                "Vision analysis failed:",
                error,
            )

            vision_result = {
                "success": False,
                "detected_issue": None,
                "confidence": 0.0,
                "objects": [],
                "message": "Vision analysis failed.",
            }

    # -----------------------------------------------------
    # AI OPERATIONAL RECOMMENDATION
    # -----------------------------------------------------

    recommendation_result = generate_recommendation(
        category=ai_result["category"],
        priority=ai_result["priority"],
        department=ai_result["department"],
        description=description,
        vision_result=vision_result,
    )

    recommendation_text = (
        recommendation_result["recommendation"]
    )

    # Add the operational recommendation to the
    # existing AI response shown in complaint details.
    final_ai_response = (
        f"{ai_response}\n\n"
        "AI Operational Recommendation:\n"
        f"{recommendation_text}"
    )

    # -----------------------------------------------------
    # Create database record
    # -----------------------------------------------------

    complaint = Complaint(
        complaint_id=complaint_id,
        user_name=user_name,
        email=email,
        mobile=mobile,
        category=ai_result["category"],
        description=description,
        image_path=image_path,
        location_text=location_text,
        latitude=latitude,
        longitude=longitude,
        priority=ai_result["priority"],
        department=ai_result["department"],
        status="Submitted",
        ai_summary=description,
        ai_response=final_ai_response,
    )

    db.add(complaint)

    try:
        db.commit()
        db.refresh(complaint)

    except Exception as error:
        db.rollback()

        print(
            "Database save failed:",
            error,
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to save the complaint."
            ),
        )

    # -----------------------------------------------------
    # Send email
    # -----------------------------------------------------

    email_sent = False
    email_error_message = None

    try:

        send_complaint_email(
            email=complaint.email,
            complaint_id=complaint.complaint_id,
            category=complaint.category,
            priority=complaint.priority,
            department=complaint.department,
            ai_response=complaint.ai_response,
        )

        email_sent = True

        print(
            f"Email sent successfully to "
            f"{complaint.email}"
        )

    except Exception as email_error:

        email_error_message = str(
            email_error
        )

        print(
            "Email sending failed:",
            email_error_message,
        )

    # -----------------------------------------------------
    # Response
    # -----------------------------------------------------

    return {
        "success": True,
        "message": (
            "Complaint submitted successfully."
        ),
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
        "image_uploaded":
            image_path is not None,
        "image_path":
            image_path,
        "ai_response":
            complaint.ai_response,

        "vision": {
            "success":
                vision_result["success"],
            "detected_issue":
                vision_result["detected_issue"],
            "confidence":
                vision_result["confidence"],
            "objects":
                vision_result["objects"],
            "message":
                vision_result["message"],
        },

        "recommendation": {
            "success":
                recommendation_result["success"],
            "recommended_action":
                recommendation_result["recommended_action"],
            "priority_action":
                recommendation_result["priority_action"],
            "next_step":
                recommendation_result["next_step"],
            "vision_message":
                recommendation_result["vision_message"],
            "recommendation":
                recommendation_result["recommendation"],
        },

        "email_sent":
            email_sent,
        "email_error":
            email_error_message,
    }


# =========================================================
# GET COMPLAINTS
# =========================================================

@router.get("/")
def get_complaints(
    current_user: User = Depends(
        get_authenticated_user
    ),
    db: Session = Depends(get_db),
):

    # Admin sees everything
    if current_user.role == "admin":

        return (
            db.query(Complaint)
            .order_by(
                Complaint.created_at.desc()
            )
            .all()
        )

    # Officer sees only their department
    if current_user.role == "officer":

        return (
            db.query(Complaint)
            .filter(
                Complaint.department
                == current_user.department
            )
            .order_by(
                Complaint.created_at.desc()
            )
            .all()
        )

    # Citizen sees only their complaints
    return (
        db.query(Complaint)
        .filter(
            Complaint.email
            == current_user.email
        )
        .order_by(
            Complaint.created_at.desc()
        )
        .all()
    )


# =========================================================
# GET USER COMPLAINTS
# =========================================================

@router.get(
    "/user/{email}"
)
def get_user_complaints(
    email: str,

    current_user: User = Depends(
        get_authenticated_user
    ),

    db: Session = Depends(get_db),
):

    requested_email = (
        email.strip().lower()
    )

    # -----------------------------------------------------
    # Admin may inspect any citizen
    # -----------------------------------------------------

    if current_user.role == "admin":
        pass

    # -----------------------------------------------------
    # Citizen can ONLY inspect themselves
    # -----------------------------------------------------

    elif current_user.role == "citizen":

        if (
            requested_email
            != current_user.email.lower()
        ):

            raise HTTPException(
                status_code=403,
                detail=(
                    "You can only access "
                    "your own complaints."
                ),
            )

    # -----------------------------------------------------
    # Officers should use department queue
    # -----------------------------------------------------

    else:

        raise HTTPException(
            status_code=403,
            detail=(
                "Officers should use the "
                "department complaint queue."
            ),
        )

    return (
        db.query(Complaint)
        .filter(
            Complaint.email
            == requested_email
        )
        .order_by(
            Complaint.created_at.desc()
        )
        .all()
    )


# =========================================================
# GET SINGLE COMPLAINT
# =========================================================

@router.get(
    "/id/{complaint_id}"
)
def get_complaint(
    complaint_id: str,

    current_user: User = Depends(
        get_authenticated_user
    ),

    db: Session = Depends(get_db),
):

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

    # -----------------------------------------------------
    # Admin
    # -----------------------------------------------------

    if current_user.role == "admin":
        return complaint

    # -----------------------------------------------------
    # Officer
    # -----------------------------------------------------

    if current_user.role == "officer":

        if (
            complaint.department
            != current_user.department
        ):

            raise HTTPException(
                status_code=403,
                detail=(
                    "You are not authorized "
                    "to access this complaint."
                ),
            )

        return complaint

    # -----------------------------------------------------
    # Citizen
    # -----------------------------------------------------

    if (
        complaint.email
        != current_user.email
    ):

        raise HTTPException(
            status_code=403,
            detail=(
                "You are not authorized "
                "to access this complaint."
            ),
        )

    return complaint
