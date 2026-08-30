from rag.knowledge_base import get_knowledge


CATEGORY_KEYWORDS = {
    "Garbage Overflow": [
        "garbage",
        "waste",
        "trash",
        "rubbish",
        "dump",
        "dustbin",
        "sanitation",
    ],
    "Pothole / Road Damage": [
        "pothole",
        "road damage",
        "damaged road",
        "road",
        "street damage",
        "crack",
    ],
    "Water Leakage": [
        "water leakage",
        "water leak",
        "leaking pipe",
        "pipe leak",
        "water wastage",
        "leakage",
    ],
    "Damaged Streetlight": [
        "streetlight",
        "street light",
        "lamp post",
        "broken light",
        "lights not working",
    ],
}


def detect_category(message: str):
    text = message.lower()

    for category, keywords in CATEGORY_KEYWORDS.items():
        for keyword in keywords:
            if keyword in text:
                return category

    return None


def generate_chat_response(message: str) -> str:
    text = message.strip()

    if not text:
        return (
            "Please type your civic question. "
            "I can help with garbage, potholes, water leakage, "
            "streetlights, complaint submission, and complaint tracking."
        )

    lower_text = text.lower()

    if (
        "how do i submit" in lower_text
        or "how to submit" in lower_text
        or "submit a complaint" in lower_text
        or "report an issue" in lower_text
        or "file a complaint" in lower_text
    ):
        return (
            "To submit a civic complaint, choose the appropriate issue "
            "card on the dashboard, describe the problem clearly, "
            "upload a supporting image when available, add the location, "
            "and submit the complaint. The system will classify the issue, "
            "assign priority and department, and provide an AI response."
        )

    if (
        "track my complaint" in lower_text
        or "track complaint" in lower_text
        or "complaint status" in lower_text
        or "status of my complaint" in lower_text
        or "where is my complaint" in lower_text
    ):
        return (
            "You can track your complaints in the 'My Complaints' "
            "section of your dashboard. The status can move through "
            "Submitted, In Progress, Resolved, or Rejected."
        )

    category = detect_category(text)

    if category:
        knowledge = get_knowledge(category)

        if knowledge:
            guidance = knowledge.get(
                "response_guidance",
                "",
            ).strip()

            if guidance:
                return (
                    f"For {category}, here is some guidance:\n\n"
                    f"{guidance}\n\n"
                    "You can also submit this issue through the "
                    "corresponding complaint category."
                )

        return (
            f"I can help with {category.lower()}. Please submit a clear "
            "description, add the location, and upload an image when possible."
        )

    if any(
        word in lower_text
        for word in [
            "hello",
            "hi",
            "hey",
            "good morning",
            "good evening",
        ]
    ):
        return (
            "Hello! 👋 I am the Smart City AI Assistant. I can help you "
            "with civic complaints, issue reporting, complaint tracking, "
            "and basic guidance for supported municipal issues."
        )

    if (
        "what can you do" in lower_text
        or "help me" in lower_text
        or "what do you do" in lower_text
    ):
        return (
            "I can help you understand supported civic issues, guide you "
            "through complaint submission, explain complaint tracking, "
            "and provide guidance for garbage overflow, potholes or road "
            "damage, water leakage, and damaged streetlights."
        )

    return (
        "I can help with supported Smart City issues such as garbage "
        "overflow, potholes or road damage, water leakage, and damaged "
        "streetlights. You can also ask me how to submit or track a complaint."
    )
