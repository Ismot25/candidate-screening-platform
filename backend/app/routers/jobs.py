"""Job routes: create, list, view, edit, close (recruiter) + browse (candidate)."""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import Application, Job, JobStatus, User, UserRole
from ..schemas import JobCreate, JobOut, JobUpdate
from ..security import get_current_user, require_recruiter

router = APIRouter(prefix="/jobs", tags=["jobs"])


def _serialize_job(job: Job, db: Session, current_user: User | None) -> JobOut:
    """Attach computed fields (application_count, has_applied) to a job."""
    count = db.query(func.count(Application.id)).filter(Application.job_id == job.id).scalar()
    data = JobOut.model_validate(job)
    data.application_count = count or 0
    if current_user and current_user.role == UserRole.candidate:
        applied = (
            db.query(Application.id)
            .filter(Application.job_id == job.id, Application.candidate_id == current_user.id)
            .first()
        )
        data.has_applied = applied is not None
    return data


@router.post("", response_model=JobOut, status_code=status.HTTP_201_CREATED)
def create_job(
    payload: JobCreate,
    db: Session = Depends(get_db),
    recruiter: User = Depends(require_recruiter),
):
    job = Job(**payload.model_dump(), recruiter_id=recruiter.id)
    db.add(job)
    db.commit()
    db.refresh(job)
    return _serialize_job(job, db, recruiter)


@router.get("", response_model=list[JobOut])
def list_jobs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    status_filter: JobStatus | None = Query(default=None, alias="status"),
    mine: bool = Query(default=False, description="Recruiters: only show jobs I created"),
    search: str | None = Query(default=None, description="Search in job title"),
):
    query = db.query(Job).options(joinedload(Job.recruiter))

    if current_user.role == UserRole.recruiter and mine:
        query = query.filter(Job.recruiter_id == current_user.id)
    elif current_user.role == UserRole.candidate:
        # Candidates only ever see open jobs.
        query = query.filter(Job.status == JobStatus.open)

    if status_filter is not None and not (current_user.role == UserRole.candidate):
        query = query.filter(Job.status == status_filter)
    if search:
        query = query.filter(Job.title.ilike(f"%{search}%"))

    jobs = query.order_by(Job.created_at.desc()).all()
    return [_serialize_job(job, db, current_user) for job in jobs]


@router.get("/{job_id}", response_model=JobOut)
def get_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job = db.query(Job).options(joinedload(Job.recruiter)).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    # Candidates cannot view closed jobs they don't own.
    if current_user.role == UserRole.candidate and job.status != JobStatus.open:
        raise HTTPException(status_code=404, detail="Job not found")
    return _serialize_job(job, db, current_user)


def _get_owned_job(job_id: int, db: Session, recruiter: User) -> Job:
    job = db.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.recruiter_id != recruiter.id:
        raise HTTPException(status_code=403, detail="You can only manage your own jobs")
    return job


@router.patch("/{job_id}", response_model=JobOut)
def update_job(
    job_id: int,
    payload: JobUpdate,
    db: Session = Depends(get_db),
    recruiter: User = Depends(require_recruiter),
):
    job = _get_owned_job(job_id, db, recruiter)
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(job, field, value)
    db.commit()
    db.refresh(job)
    return _serialize_job(job, db, recruiter)


@router.post("/{job_id}/close", response_model=JobOut)
def close_job(
    job_id: int,
    db: Session = Depends(get_db),
    recruiter: User = Depends(require_recruiter),
):
    job = _get_owned_job(job_id, db, recruiter)
    job.status = JobStatus.closed
    db.commit()
    db.refresh(job)
    return _serialize_job(job, db, recruiter)
