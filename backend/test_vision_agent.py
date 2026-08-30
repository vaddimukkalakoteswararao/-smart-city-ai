from agents.vision_agent import analyze_image


IMAGE_PATH = (
    r"D:\OneDrive\Desktop\AI Smart City Project"
    r"\uploads\complaints\CMP-0D7A0051.jpg"
)


result = analyze_image(
    IMAGE_PATH
)


print()
print("Smart City Computer Vision Agent")
print("=" * 50)

print(
    f"Success: "
    f"{result['success']}"
)

print(
    f"Detected Issue: "
    f"{result['detected_issue']}"
)

print(
    f"Confidence: "
    f"{result['confidence']}"
)

print(
    f"Objects: "
    f"{result['objects']}"
)

print(
    f"Message: "
    f"{result['message']}"
)