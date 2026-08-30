from typing import Dict


CATEGORY_RULES = {
    "Garbage Overflow": [
        "garbage",
        "garbage overflow",
        "garbage overflowing",
        "waste",
        "waste overflow",
        "overflowing waste",
        "trash",
        "rubbish",
        "dump",
        "dumping",
        "uncollected garbage",
        "garbage not collected",
        "waste not collected",
        "garbage has not been collected",
        "garbage was not taken",
        "waste was not taken",
        "not taken garbage",
        "not picked up",
        "dirty garbage",
    ],

    "Pothole / Road Damage": [
        "pothole",
        "potholes",
        "pot hole",
        "pot holes",
        "path hole",
        "path holes",
        "road damage",
        "road damaged",
        "damaged road",
        "broken road",
        "road is broken",
        "road is damaged",
        "roads are damaged",
        "roads have been damaged",
        "road has been damaged",
        "road crack",
        "road cracks",
        "cracked road",
        "road surface damaged",
        "bad road",
        "bad roads",
        "rough road",
        "rough roads",
        "road condition is bad",
        "difficult to cross",
        "difficult to pass",
        "difficult to travel",
        "cannot cross the road",
        "can't cross the road",
        "hard to cross",
        "hard to pass",
        "road is difficult to cross",
        "road is difficult to pass",
    ],

    "Water Leakage": [
        "water leakage",
        "water leak",
        "water leaking",
        "leaking water",
        "leaking pipe",
        "leak in pipe",
        "pipe leak",
        "pipe burst",
        "burst pipe",
        "water wastage",
        "water is leaking",
        "water coming out",
        "water flowing from pipe",
        "broken water pipe",
    ],

    "Damaged Streetlight": [
        "streetlight",
        "street light",
        "street lights",
        "street lamps",
        "lamp post",
        "lamp posts",
        "broken light",
        "broken streetlight",
        "streetlight broken",
        "streetlight not working",
        "street light not working",
        "light not working",
        "lights not working",
        "no street light",
        "street is dark",
        "dark street",
        "road is dark",
    ],
}


DEPARTMENT_MAP = {
    "Garbage Overflow": "Sanitation Department",
    "Pothole / Road Damage": "Roads and Infrastructure Department",
    "Water Leakage": "Water Supply Department",
    "Damaged Streetlight": "Electrical Department",
}


HIGH_PRIORITY_WORDS = [
    "danger",
    "dangerous",
    "accident",
    "urgent",
    "emergency",
    "severe",
    "major",
    "blocked",
    "blocking",
    "overflowing",
    "flooding",
    "injury",
    "risk",
    "unsafe",
    "school",
    "hospital",
]


def normalize_text(text: str) -> str:
    return " ".join(
        text.lower()
        .replace("-", " ")
        .replace("/", " ")
        .split()
    )


def classify_complaint(description: str) -> Dict[str, str]:
    text = normalize_text(description)

    category = "Unknown"

    # Check categories in order.
    for possible_category, keywords in CATEGORY_RULES.items():
        for keyword in keywords:
            normalized_keyword = normalize_text(keyword)

            if normalized_keyword in text:
                category = possible_category
                break

        if category != "Unknown":
            break

    # Determine department.
    if category in DEPARTMENT_MAP:
        department = DEPARTMENT_MAP[category]
    else:
        department = "Municipal General Services"

    # Determine priority.
    priority = "Medium"

    if any(
        word in text
        for word in HIGH_PRIORITY_WORDS
    ):
        priority = "High"

    return {
        "category": category,
        "priority": priority,
        "department": department,
    }