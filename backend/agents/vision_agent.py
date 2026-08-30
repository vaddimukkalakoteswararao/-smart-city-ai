from __future__ import annotations

import os

from typing import Any


# ---------------------------------------------------------
# Configuration
# ---------------------------------------------------------

MODEL_PATH = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__),
        "..",
        "models",
        "smartcity_pothole_yolo11n.pt",
    )
)

SUPPORTED_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".gif",
}


# ---------------------------------------------------------
# Lazy-loaded model
# ---------------------------------------------------------

model = None
MODEL_LOAD_ERROR = None
MODEL_LOAD_ATTEMPTED = False


def _get_model():
    """
    Load the YOLO model only when image analysis is actually
    requested.

    This keeps application startup fast so Render can detect
    the HTTP port before the heavier computer-vision model
    initialization happens.
    """
    global model
    global MODEL_LOAD_ERROR
    global MODEL_LOAD_ATTEMPTED

    if MODEL_LOAD_ATTEMPTED:
        return model

    MODEL_LOAD_ATTEMPTED = True

    try:
        from ultralytics import YOLO

        model = YOLO(MODEL_PATH)
        MODEL_LOAD_ERROR = None

        print(
            f"YOLO model loaded successfully: "
            f"{MODEL_PATH}"
        )

    except Exception as error:
        model = None
        MODEL_LOAD_ERROR = str(error)

        print(
            "YOLO model could not be loaded:",
            MODEL_LOAD_ERROR,
        )

    return model


# ---------------------------------------------------------
# Vision Agent
# ---------------------------------------------------------

def analyze_image(
    image_path: str,
) -> dict[str, Any]:
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
    # Load model lazily
    # -----------------------------------------------------

    vision_model = _get_model()

    if vision_model is None:
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
        predictions = vision_model(
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

                class_name = vision_model.names[
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

                # Keep highest-confidence detection
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