def create_complaint_sms(
    mobile: str,
    complaint_id: str,
    category: str,
    priority: str,
    department: str,
):
    message = (
        f"Smart City AI: Complaint {complaint_id} "
        f"registered. Category: {category}. "
        f"Priority: {priority}. "
        f"Department: {department}. "
        f"Status: Submitted."
    )

    return {
        "to": mobile,
        "message": message,
    }

