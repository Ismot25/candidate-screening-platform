"""FastAPI application entry point."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import Base, engine
from .routers import applications, auth, jobs

# Create tables on startup. For a production Postgres setup you'd use Alembic
# migrations instead; create_all keeps the evaluation setup zero-config.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Candidate Screening Platform API",
    description="A simplified platform for recruiters to manage jobs and candidates to apply.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(jobs.router)
app.include_router(applications.router)


@app.get("/", tags=["health"])
def health():
    return {"status": "ok", "service": "candidate-screening-platform"}
