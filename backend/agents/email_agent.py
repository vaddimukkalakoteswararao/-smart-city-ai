import json
import os
import urllib.error
import urllib.request

from dotenv import load_dotenv


load_dotenv()


# =========================================================
# RESEND CONFIGURATION
# =========================================================

RESEND_API_URL = "https://api.resend.com/emails"

RESEND_API_KEY = os.getenv(
    "RESEND_API_KEY"
)

RESEND_FROM_EMAIL = os.getenv(
    "RESEND_FROM_EMAIL",
    "Smart City AI <onboarding@resend.dev>",
)


# =========================================================
# CREATE COMPLAINT EMAIL
# =========================================================

def create_complaint_email(
    email: str,
    complaint_id: str,
    category: str,
    priority: str,
    department: str,
    ai_response: str,
):
    subject = (
        f"Smart City AI - Complaint {complaint_id}"
    )

    body = f"""
Hello,

Your civic complaint has been successfully
registered with Smart City AI.

Complaint ID: {complaint_id}
Category: {category}
Priority: {priority}
Department: {department}
Status: Submitted

AI Response:
{ai_response}

You can use your Complaint ID to track
the complaint status.

Thank you for helping improve our city.

Smart City AI
Civic Complaint Management System
"""

    return {
        "to": email,
        "subject": subject,
        "body": body.strip(),
    }


# =========================================================
# SEND COMPLAINT EMAIL USING RESEND HTTPS API
# =========================================================

def send_complaint_email(
    email: str,
    complaint_id: str,
    category: str,
    priority: str,
    department: str,
    ai_response: str,
):
    if not RESEND_API_KEY:
        raise RuntimeError(
            "RESEND_API_KEY is not configured."
        )

    email_data = create_complaint_email(
        email=email,
        complaint_id=complaint_id,
        category=category,
        priority=priority,
        department=department,
        ai_response=ai_response,
    )

    payload = {
        "from": RESEND_FROM_EMAIL,
        "to": [email_data["to"]],
        "subject": email_data["subject"],
        "text": email_data["body"],
    }

    request = urllib.request.Request(
        RESEND_API_URL,
        data=json.dumps(
            payload
        ).encode("utf-8"),
        headers={
            "Authorization": (
                f"Bearer {RESEND_API_KEY}"
            ),
            "Content-Type": "application/json",
            "User-Agent": (
                "Smart-City-AI/1.0"
            ),
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(
            request,
            timeout=30,
        ) as response:

            response_body = (
                response.read()
                .decode("utf-8")
            )

            if response.status < 200 or response.status >= 300:
                raise RuntimeError(
                    "Resend API returned "
                    f"HTTP {response.status}: "
                    f"{response_body}"
                )

            result = json.loads(
                response_body
            )

            if not result.get("id"):
                raise RuntimeError(
                    "Resend API did not return "
                    "an email ID."
                )

            print(
                "Email sent successfully "
                f"to {email}"
            )

            print(
                f"Resend Email ID: "
                f"{result['id']}"
            )

            return True

    except urllib.error.HTTPError as error:
        error_body = ""

        try:
            error_body = (
                error.read()
                .decode("utf-8")
            )
        except Exception:
            pass

        raise RuntimeError(
            "Resend API error "
            f"{error.code}: "
            f"{error_body}"
        ) from error

    except urllib.error.URLError as error:
        raise RuntimeError(
            "Unable to reach Resend API: "
            f"{error.reason}"
        ) from error