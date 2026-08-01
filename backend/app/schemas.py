"""Pydantic schemas for request/response validation."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, HttpUrl

from .models import ApplicationStatus, JobStatus, UserRole


# ---------- Auth / User ----------
class UserBase(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=1, max_length=255)


class UserCreate(UserBase):
    password: str = Field(min_length=6, max_length=128)
    role: UserRole


class UserOut(UserBase):
    id: int
    role: UserRole
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- Jobs ----------
class JobBase(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str = Field(min_length=1)
    location: str | None = Field(default=None, max_length=255)
    employment_type: str | None = Field(default=None, max_length=100)
    salary_range: str | None = Field(default=None, max_length=100)


class JobCreate(JobBase):
    pass


class JobUpdate(BaseModel):
    # All optional: partial update (PATCH).
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, min_length=1)
    location: str | None = Field(default=None, max_length=255)
    employment_type: str | None = Field(default=None, max_length=100)
    salary_range: str | None = Field(default=None, max_length=100)
    status: JobStatus | None = None


class RecruiterInfo(BaseModel):
    id: int
    full_name: str
    model_config = ConfigDict(from_attributes=True)


class JobOut(JobBase):
    id: int
    status: JobStatus
    recruiter_id: int
    created_at: datetime
    updated_at: datetime
    recruiter: RecruiterInfo
    application_count: int = 0
    # Present only when the requester is a candidate: whether they already applied.
    has_applied: bool | None = None
    model_config = ConfigDict(from_attributes=True)


# ---------- Applications ----------
class ApplicationCreate(BaseModel):
    resume_url: HttpUrl
    cover_letter: str | None = None


class ApplicationStatusUpdate(BaseModel):
    status: ApplicationStatus


class CandidateInfo(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    model_config = ConfigDict(from_attributes=True)


class JobSummary(BaseModel):
    id: int
    title: str
    status: JobStatus
    model_config = ConfigDict(from_attributes=True)


class ApplicationOut(BaseModel):
    id: int
    job_id: int
    candidate_id: int
    resume_url: str
    cover_letter: str | None
    status: ApplicationStatus
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ApplicationForRecruiter(ApplicationOut):
    """Application enriched with candidate details for the recruiter's review view."""
    candidate: CandidateInfo


class ApplicationForCandidate(ApplicationOut):
    """Application enriched with job details for the candidate's tracking view."""
    job: JobSummary
