from agents.recommendation_agent import (
    generate_recommendation,
)


result = generate_recommendation(
    category="Pothole / Road Damage",
    priority="High",
    department="Roads and Infrastructure Department",
    description="Large pothole reported near the main road.",
    vision_result={
        "detected_issue": "pothole",
        "confidence": 0.82,
    },
)


print()
print("SMART CITY AI RECOMMENDATION TEST")
print("=" * 55)

print("Success:")
print(result["success"])

print()
print("Category:")
print(result["category"])

print()
print("Priority:")
print(result["priority"])

print()
print("Department:")
print(result["department"])

print()
print("Recommended Action:")
print(result["recommended_action"])

print()
print("Priority Action:")
print(result["priority_action"])

print()
print("Next Step:")
print(result["next_step"])

print()
print("Vision:")
print(result["vision_message"])

print()
print("Full Recommendation:")
print(result["recommendation"])