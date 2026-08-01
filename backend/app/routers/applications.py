"""Application routes: apply (candidate), review (recruiter), track, update status."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import Application, Job, JobStatus, User
from ..schemas import (
    ApplicationCreate,
    ApplicationForCandidate,
    ApplicationForRecruiter,
    ApplicationOut,
    ApplicationStatusUpdate,
)
from ..security import get_current_user, require_candidate, require_recruiter

router = APIRouter(tags=["applications"])


@router.post(
    "/jobs/{job_id}/applications",
    response_model=ApplicationOut,
    status_code=status.HTTP_201_CREATED,
)
def apply_to_job(
    job_id: int,
    payload: ApplicationCreate,
    db: Session = Depends(get_db),
    candidate: User = Depends(require_candidate),
):
    job = db.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status != JobStatus.open:
        raise HTTPException(status_code=400, detail="This job is no longer accepting applications")

    already = (
        db.query(Application)
        .filter(Application.job_id == job_id, Application.candidate_id == candidate.id)
        .first()
    )
    if already:
        raise HTTPException(status_code=409, detail="You have already applied to this job")

    application = Application(
        job_id=job_id,
        candidate_id=candidate.id,
        resume_url=str(payload.resume_url),
        cover_letter=payload.cover_letter,
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    return application


@router.get("/jobs/{job_id}/applications", response_model=list[ApplicationForRecruiter])
def list_job_applications(
    job_id: int,
    db: Session = Depends(get_db),
    recruiter: User = Depends(require_recruiter),
):
    job = db.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.recruiter_id != recruiter.id:
        raise HTTPException(status_code=403, detail="You can only review applications for your own jobs")

    return (
        db.query(Application)
        .options(joinedload(Application.candidate))
        .filter(Application.job_id == job_id)
        .order_by(Application.created_at.desc())
        .all()
    )


@router.get("/applications/me", response_model=list[ApplicationForCandidate])
def my_applications(
    db: Session = Depends(get_db),
    candidate: User = Depends(require_candidate),
):
    return (
        db.query(Application)
        .options(joinedload(Application.job))
        .filter(Application.candidate_id == candidate.id)
        .order_by(Application.created_at.desc())
        .all()
    )


@router.patch("/applications/{application_id}/status", response_model=ApplicationForRecruiter)
def update_application_status(
    application_id: int,
    payload: ApplicationStatusUpdate,
    db: Session = Depends(get_db),
    recruiter: User = Depends(require_recruiter),
):
    application = (
        db.query(Application)
        .options(joinedload(Application.job), joinedload(Application.candidate))
        .filter(Application.id == application_id)
        .first()
    )
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    if application.job.recruiter_id != recruiter.id:
        raise HTTPException(
            status_code=403, detail="You can only update applications for your own jobs"
        )

    application.status = payload.status
    db.commit()
    db.refresh(application)
    return application
