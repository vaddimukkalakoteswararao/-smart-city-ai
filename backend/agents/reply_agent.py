from rag.knowledge_base import get_knowledge


def generate_reply(
    complaint_description: str,
    category: str,
    priority: str,
    department: str,
    complaint_id: str,
) -> str:
    knowledge = get_knowledge(category)

    if knowledge:
        guidance = knowledge["response_guidance"]
    else:
        guidance = (
            "Your complaint has been registered and forwarded "
            "to the appropriate municipal department."
        )

    return (
        f"Thank you for reporting this civic issue. "
        f"Your complaint ID is {complaint_id}. "
        f"The issue has been classified as {category} with "
        f"{priority} priority and forwarded to the {department}. "
        f"{guidance}"
    )