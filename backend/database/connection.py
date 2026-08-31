import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker


# =========================================================
# DATABASE CONFIGURATION
# =========================================================

# Local development:
#     Uses SQLite automatically.
#
# Render / production:
#     Uses PostgreSQL when DATABASE_URL is provided
#     in the environment variables.
#
DATABASE_URL = os.getenv(
    "DATABASE_URL"
)


# ---------------------------------------------------------
# PostgreSQL
# ---------------------------------------------------------

if DATABASE_URL:

    # Render may provide postgres:// or postgresql://.
    # SQLAlchemy + psycopg2 uses postgresql+psycopg2://
    if DATABASE_URL.startswith(
        "postgres://"
    ):
        DATABASE_URL = DATABASE_URL.replace(
            "postgres://",
            "postgresql+psycopg2://",
            1,
        )

    elif DATABASE_URL.startswith(
        "postgresql://"
    ):
        DATABASE_URL = DATABASE_URL.replace(
            "postgresql://",
            "postgresql+psycopg2://",
            1,
        )

    connect_args = {}


# ---------------------------------------------------------
# Local SQLite fallback
# ---------------------------------------------------------

else:

    DATABASE_URL = (
        "sqlite:///./smart_city.db"
    )

    connect_args = {
        "check_same_thread": False
    }


# =========================================================
# SQLALCHEMY ENGINE
# =========================================================

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
)


# =========================================================
# SESSION
# =========================================================

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


# =========================================================
# BASE MODEL
# =========================================================

Base = declarative_base()


# =========================================================
# DATABASE DEPENDENCY
# =========================================================

def get_db():

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()