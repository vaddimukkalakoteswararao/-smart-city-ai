from agents.classification_agent import classify_complaint
from agents.reply_agent import generate_reply


def process_complaint(
    description: str,
    complaint_id: str,
):
    """
    Multi-agent complaint processing workflow.

    Agent 1:
        Classification Agent
        Determines category, priority and department.

    Agent 2:
        Reply Agent
        Generates a citizen-facing response using
        the classification result and RAG knowledge.
    """

    # Agent 1: Classification
    classification = classify_complaint(description)

    # Agent 2: Reply generation
    reply = generate_reply(
        complaint_description=description,
        category=classification["category"],
        priority=classification["priority"],
        department=classification["department"],
        complaint_id=complaint_id,
    )

    return {
        "category": classification["category"],
        "priority": classification["priority"],
        "department": classification["department"],
        "reply": reply,
    }