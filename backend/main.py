import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database.connection import Base, engine

# Import all models so SQLAlchemy knows about every table
from models.complaint import Complaint
from models.user import User
from models.complaint_history import ComplaintHistory

# Import routers
from routes.complaints import router as complaints_router
from routes.admin import router as admin_router
from routes.auth import router as auth_router


# =========================================================
# DATABASE
# =========================================================

Base.metadata.create_all(
    bind=engine
)


# =========================================================
# FASTAPI APPLICATION
# =========================================================

app = FastAPI(
    title="Smart City AI",
    description=(
        "AI-powered civic complaint "
        "management system"
    ),
    version="1.0.0",
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# PROJECT DIRECTORIES
# =========================================================

# Current file:
#
# AI Smart City Project/
#     backend/
#         main.py
#
# We want:
#
# AI Smart City Project/
#     uploads/
#         complaints/

BACKEND_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

PROJECT_DIR = os.path.dirname(
    BACKEND_DIR
)

UPLOADS_DIR = os.path.join(
    PROJECT_DIR,
    "uploads",
)

COMPLAINT_UPLOADS_DIR = os.path.join(
    UPLOADS_DIR,
    "complaints",
)


# Create upload folders if they don't exist
os.makedirs(
    COMPLAINT_UPLOADS_DIR,
    exist_ok=True,
)


# =========================================================
# STATIC FILES
# =========================================================

# This makes uploaded complaint images available at:
#
# http://127.0.0.1:8001/uploads/complaints/<filename>

app.mount(
    "/uploads",
    StaticFiles(
        directory=UPLOADS_DIR
    ),
    name="uploads",
)


# =========================================================
# ROUTERS
# =========================================================

# Citizen complaint APIs
app.include_router(
    complaints_router
)

# Admin / officer APIs
app.include_router(
    admin_router
)

# Authentication APIs
app.include_router(
    auth_router
)


# =========================================================
# ROOT ENDPOINT
# =========================================================

@app.get("/")
def home():
    return {
        "message": (
            "Smart City AI Backend is running!"
        )
    }


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }