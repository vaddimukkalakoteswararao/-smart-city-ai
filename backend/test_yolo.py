from ultralytics import YOLO


# Load the pretrained YOLO model
model = YOLO("yolo11n.pt")


# Change this to one of your actual complaint images
IMAGE_PATH = (
    r"D:\OneDrive\Desktop\AI Smart City Project"
    r"\uploads\complaints\CMP-0D7A0051.jpg"
)


# Run object detection
results = model(
    IMAGE_PATH,
    conf=0.25,
)


print()
print("YOLO Object Detection Result")
print("=" * 40)

for result in results:

    if result.boxes is None:
        print("No objects detected.")
        continue

    if len(result.boxes) == 0:
        print("No objects detected.")
        continue

    for box in result.boxes:

        class_id = int(
            box.cls[0].item()
        )

        confidence = float(
            box.conf[0].item()
        )

        class_name = (
            model.names[class_id]
        )

        print(
            f"Object: {class_name}"
        )

        print(
            f"Confidence: "
            f"{confidence:.2f}"
        )

        print("-" * 40)