import os
import smtplib
from email.message import EmailMessage

from dotenv import load_dotenv


load_dotenv()


SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_EMAIL = os.getenv("SMTP_EMAIL")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")


def create_complaint_email(
    email: str,
    complaint_id: str,
    category: str,
    priority: str,
    department: str,
    ai_response: str,
):
    subject = f"Smart City AI - Complaint {complaint_id}"

    body = f"""
Hello,

Your civic complaint has been successfully registered with Smart City AI.

Complaint ID: {complaint_id}
Category: {category}
Priority: {priority}
Department: {department}
Status: Submitted

AI Response:
{ai_response}

You can use your Complaint ID to track the complaint status.

Thank you for helping improve our city.

Smart City AI
Civic Complaint Management System
"""

    return {
        "to": email,
        "subject": subject,
        "body": body.strip(),
    }


def send_complaint_email(
    email: str,
    complaint_id: str,
    category: str,
    priority: str,
    department: str,
    ai_response: str,
):
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        raise RuntimeError(
            "SMTP_EMAIL and SMTP_PASSWORD are not configured."
        )

    email_data = create_complaint_email(
        email=email,
        complaint_id=complaint_id,
        category=category,
        priority=priority,
        department=department,
        ai_response=ai_response,
    )

    message = EmailMessage()
    message["From"] = SMTP_EMAIL
    message["To"] = email_data["to"]
    message["Subject"] = email_data["subject"]
    message.set_content(email_data["body"])

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_EMAIL, SMTP_PASSWORD)
        server.send_message(message)

    return True