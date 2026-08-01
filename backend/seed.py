"""Seed the database with demo recruiters, candidates, jobs, and applications.

Run from the backend/ directory:  python seed.py
Idempotent: it clears existing rows first so you get a clean, known dataset.
"""
from app.database import Base, SessionLocal, engine
from app.models import Application, ApplicationStatus, Job, JobStatus, User, UserRole
from app.security import hash_password

Base.metadata.create_all(bind=engine)


def run():
    db = SessionLocal()
    try:
        # Clean slate.
        db.query(Application).delete()
        db.query(Job).delete()
        db.query(User).delete()
        db.commit()

        recruiter = User(
            email="recruiter@demo.com",
            full_name="Samia Recruiter",
            hashed_password=hash_password("password123"),
            role=UserRole.recruiter,
        )
        recruiter2 = User(
            email="recruiter2@demo.com",
            full_name="Sam Sourcer",
            hashed_password=hash_password("password123"),
            role=UserRole.recruiter,
        )
        candidate = User(
            email="candidate@demo.com",
            full_name="Cathy Candidate",
            hashed_password=hash_password("password123"),
            role=UserRole.candidate,
        )
        candidate2 = User(
            email="candidate2@demo.com",
            full_name="Carl Coder",
            hashed_password=hash_password("password123"),
            role=UserRole.candidate,
        )
        db.add_all([recruiter, recruiter2, candidate, candidate2])
        db.commit()

        jobs = [
            Job(
                title="Senior Backend Engineer",
                description="Build and scale our FastAPI services. Experience with Python, "
                "PostgreSQL, and distributed systems required.",
                location="Remote",
                employment_type="Full-time",
                salary_range="$120k - $160k",
                status=JobStatus.open,
                recruiter_id=recruiter.id,
            ),
            Job(
                title="Frontend Engineer (React)",
                description="Own our candidate-facing React app. Strong JS/TS, React hooks, "
                "and an eye for clean UX.",
                location="Berlin, Germany",
                employment_type="Full-time",
                salary_range="€65k - €85k",
                status=JobStatus.open,
                recruiter_id=recruiter.id,
            ),
            Job(
                title="Data Analyst (Closed Example)",
                description="SQL, dashboards, and stakeholder reporting. This posting is closed.",
                location="New York, NY",
                employment_type="Contract",
                salary_range="$60/hr",
                status=JobStatus.closed,
                recruiter_id=recruiter2.id,
            ),
        ]
        db.add_all(jobs)
        db.commit()

        applications = [
            Application(
                job_id=jobs[0].id,
                candidate_id=candidate.id,
                resume_url="https://example.com/resumes/cathy.pdf",
                cover_letter="I have 6 years of Python backend experience.",
                status=ApplicationStatus.screening,
            ),
            Application(
                job_id=jobs[0].id,
                candidate_id=candidate2.id,
                resume_url="https://example.com/resumes/carl.pdf",
                cover_letter="Excited about your scaling challenges!",
                status=ApplicationStatus.applied,
            ),
            Application(
                job_id=jobs[1].id,
                candidate_id=candidate.id,
                resume_url="https://example.com/resumes/cathy-fe.pdf",
                cover_letter=None,
                status=ApplicationStatus.interview,
            ),
        ]
        db.add_all(applications)
        db.commit()

        print("Seed complete.")
        print("  Recruiter login:  recruiter@demo.com  / password123")
        print("  Candidate login:  candidate@demo.com  / password123")
    finally:
        db.close()


if __name__ == "__main__":
    run()
