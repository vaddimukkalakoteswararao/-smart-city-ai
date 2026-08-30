CIVIC_KNOWLEDGE = {
    "Garbage Overflow": {
        "department": "Sanitation Department",
        "description": (
            "Handles garbage collection, waste accumulation, "
            "overflowing bins, and uncollected waste."
        ),
        "priority_rules": (
            "High priority when waste is overflowing, blocking roads, "
            "creating health risks, or causing severe odor."
        ),
        "response_guidance": (
            "Inform the citizen that the complaint has been registered "
            "and routed to the sanitation department."
        ),
    },

    "Pothole / Road Damage": {
        "department": "Roads and Infrastructure Department",
        "description": (
            "Handles potholes, damaged roads, cracks, and road hazards."
        ),
        "priority_rules": (
            "High priority when the road hazard creates an immediate "
            "safety risk or blocks traffic."
        ),
        "response_guidance": (
            "Inform the citizen that the road complaint has been "
            "registered and forwarded for inspection."
        ),
    },

    "Water Leakage": {
        "department": "Water Supply Department",
        "description": (
            "Handles leaking pipes, water wastage, pipe bursts, "
            "and related water infrastructure problems."
        ),
        "priority_rules": (
            "High priority for major leaks, flooding, or significant "
            "water wastage."
        ),
        "response_guidance": (
            "Inform the citizen that the water issue has been "
            "registered and forwarded to the water supply department."
        ),
    },

    "Damaged Streetlight": {
        "department": "Electrical Department",
        "description": (
            "Handles broken streetlights, non-working lamps, "
            "and public lighting problems."
        ),
        "priority_rules": (
            "High priority when darkness creates a major public "
            "safety concern."
        ),
        "response_guidance": (
            "Inform the citizen that the streetlight complaint has "
            "been registered and forwarded for repair."
        ),
    },
}


def get_knowledge(category: str):
    return CIVIC_KNOWLEDGE.get(category)