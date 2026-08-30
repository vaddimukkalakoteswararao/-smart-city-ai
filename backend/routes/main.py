from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database.connection import Base, engine
from models.complaint import Complaint
from routes.complaints import router as complaints_router


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Smart City AI",
    description="AI-powered civic complaint management system",
    version="1.0.0",
)


# Allow the React frontend to communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(complaints_router)


@app.get("/")
def home():
    return {
        "message": "Smart City AI Backend is running!"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }


