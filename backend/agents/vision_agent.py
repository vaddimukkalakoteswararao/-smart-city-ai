from __future__ import annotations

import os
from typing import Any

from ultralytics import YOLO


# ---------------------------------------------------------
# Configuration
# ---------------------------------------------------------

MODEL_PATH = "models/smartcity_pothole_yolo11n.pt"

SUPPORTED_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".gif",
}


# ---------------------------------------------------------
# Load the trained YOLO model once
# ---------------------------------------------------------

try:
    model = YOLO(MODEL_PATH)
    MODEL_LOAD_ERROR = None
except Exception as error:
    model = None
    MODEL_LOAD_ERROR = str(error)


# ---------------------------------------------------------
# Vision Agent
# ---------------------------------------------------------

def analyze_image(image_path: str) -> dict[str, Any]:
    """
    Analyze a complaint image using the trained
    Smart City YOLO pothole detection model.
    """

    result: dict[str, Any] = {
        "success": False,
        "detected_issue": None,
        "confidence": 0.0,
        "objects": [],
        "message": "",
    }

    # -----------------------------------------------------
    # Check whether the model loaded
    # -----------------------------------------------------

    if model is None:
        result["message"] = (
            "Vision model could not be loaded: "
            f"{MODEL_LOAD_ERROR}"
        )
        return result

    # -----------------------------------------------------
    # Validate image path
    # -----------------------------------------------------

    if not image_path:
        result["message"] = (
            "No image path was provided."
        )
        return result

    if not os.path.isfile(image_path):
        result["message"] = (
            f"Image file not found: {image_path}"
        )
        return result

    extension = (
        os.path.splitext(image_path)[1].lower()
    )

    if extension not in SUPPORTED_EXTENSIONS:
        result["message"] = (
            f"Unsupported image format: {extension}"
        )
        return result

    # -----------------------------------------------------
    # Run YOLO
    # -----------------------------------------------------

    try:
        predictions = model(
            image_path,
            conf=0.10,
            verbose=False,
        )

        detected_objects = []

        best_issue = None
        best_confidence = 0.0

        # -------------------------------------------------
        # Process detections
        # -------------------------------------------------

        for prediction in predictions:

            if (
                prediction.boxes is None
                or len(prediction.boxes) == 0
            ):
                continue

            for box in prediction.boxes:

                class_id = int(
                    box.cls[0].item()
                )

                confidence = float(
                    box.conf[0].item()
                )

                class_name = model.names[
                    class_id
                ]

                detected_objects.append(
                    {
                        "class_id": class_id,
                        "class_name": class_name,
                        "confidence": round(
                            confidence,
                            4,
                        ),
                    }
                )

                # Keep the highest-confidence detection
                if confidence > best_confidence:
                    best_confidence = confidence
                    best_issue = class_name

        # -------------------------------------------------
        # Build successful response
        # -------------------------------------------------

        result["success"] = True
        result["objects"] = detected_objects
        result["detected_issue"] = best_issue
        result["confidence"] = round(
            best_confidence,
            4,
        )

        if best_issue:
            result["message"] = (
                f"Detected {best_issue} "
                f"with confidence "
                f"{best_confidence:.2f}."
            )
        else:
            result["message"] = (
                "No supported civic issue "
                "was detected."
            )

        return result

    except Exception as error:
        result["message"] = (
            f"Image analysis failed: {error}"
        )
        return result


# ---------------------------------------------------------
# Simple manual test
# ---------------------------------------------------------

if __name__ == "__main__":

    test_image = (
        r"D:\OneDrive\Desktop\AI Smart City Project"
        r"\uploads\complaints\CMP-0D7A0051.jpg"
    )

    output = analyze_image(
        test_image
    )

    print()
    print("Smart City Computer Vision Agent")
    print("=" * 50)
    print(
        f"Success: "
        f"{output['success']}"
    )
    print(
        f"Detected Issue: "
        f"{output['detected_issue']}"
    )
    print(
        f"Confidence: "
        f"{output['confidence']}"
    )
    print(
        f"Objects: "
        f"{output['objects']}"
    )
    print(
        f"Message: "
        f"{output['message']}"
    )