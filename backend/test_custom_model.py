from ultralytics import YOLO


MODEL_PATH = "runs/detect/train/weights/best.pt"

IMAGE_PATH = (
    r"D:\OneDrive\Desktop\AI Smart City Project"
    r"\uploads\complaints\CMP-0D7A0051.jpg"
)


model = YOLO(MODEL_PATH)

results = model(
    IMAGE_PATH,
    conf=0.10,
)

print()
print("Custom Smart City Model Result")
print("=" * 45)

for result in results:

    if result.boxes is None or len(result.boxes) == 0:
        print("No pothole detected.")
        continue

    for box in result.boxes:

        class_id = int(
            box.cls[0].item()
        )

        confidence = float(
            box.conf[0].item()
        )

        class_name = model.names[
            class_id
        ]

        print(
            f"Detected: {class_name}"
        )

        print(
            f"Confidence: "
            f"{confidence:.2f}"
        )

        print("-" * 45)