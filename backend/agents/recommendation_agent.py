from __future__ import annotations

from typing import Any


def generate_recommendation(
    category: str | None,
    priority: str | None,
    department: str | None,
    description: str | None = None,
    vision_result: dict[str, Any] | None = None,
) -> dict[str, Any]:

    category = category or "Unknown"
    priority = priority or "Medium"
    department = department or "Municipal General Services"

    # -----------------------------------------------------
    # Category recommendation
    # -----------------------------------------------------

    category_actions = {
        "Garbage Overflow": (
            "Arrange waste collection and inspect the "
            "location for recurring waste accumulation."
        ),

        "Pothole / Road Damage": (
            "Inspect the road condition and prioritize "
            "repair if it creates a safety or traffic risk."
        ),

        "Water Leakage": (
            "Inspect the reported area and identify the "
            "source of the leakage before arranging repair."
        ),

        "Damaged Streetlight": (
            "Inspect the streetlight and arrange electrical "
            "repair or replacement if necessary."
        ),
    }

    recommended_action = category_actions.get(
        category,
        "Inspect the reported location and determine "
        "the appropriate municipal action.",
    )

    # -----------------------------------------------------
    # Priority recommendation
    # -----------------------------------------------------

    if priority == "High":
        priority_action = (
            "Treat this complaint as urgent and "
            "schedule an early inspection."
        )

    elif priority == "Medium":
        priority_action = (
            "Schedule the complaint within the normal "
            "municipal service cycle."
        )

    else:
        priority_action = (
            "Handle the complaint through the regular "
            "municipal service queue."
        )

    # -----------------------------------------------------
    # Vision information
    # -----------------------------------------------------

    vision_message = None

    if vision_result:

        detected_issue = vision_result.get(
            "detected_issue"
        )

        confidence = float(
            vision_result.get(
                "confidence",
                0.0,
            )
            or 0.0
        )

        if detected_issue:
            vision_message = (
                f"Computer vision detected "
                f"{detected_issue} with "
                f"{confidence:.2f} confidence."
            )

        else:
            vision_message = (
                "Computer vision did not detect a "
                "supported civic issue in the image."
            )

    # -----------------------------------------------------
    # Department instruction
    # -----------------------------------------------------

    department_action = (
        f"{department} should verify the complaint, "
        "inspect the reported location, take the "
        "appropriate action, and update the complaint status."
    )

    # -----------------------------------------------------
    # Final recommendation
    # -----------------------------------------------------

    recommendation_parts = [
        recommended_action,
        priority_action,
    ]

    if vision_message:
        recommendation_parts.append(
            vision_message
        )

    recommendation_parts.append(
        department_action
    )

    recommendation = " ".join(
        recommendation_parts
    )

    return {
        "success": True,
        "category": category,
        "priority": priority,
        "department": department,
        "recommended_action": recommended_action,
        "priority_action": priority_action,
        "next_step": (
            "Verify the complaint, inspect the location, "
            "take the required municipal action, and "
            "update the complaint status."
        ),
        "vision_message": vision_message,
        "recommendation": recommendation,
    }