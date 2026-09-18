from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=6)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class ProjectCreate(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    description: str | None = None
    project_type: str = "Carbon & Biodiversity"


class ProjectResponse(BaseModel):
    id: int
    name: str
    description: str | None
    project_type: str
    status: str
    created_at: datetime
    site_count: int = 0


class SiteCreate(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    description: str | None = None
    geometry: dict


class SiteResponse(BaseModel):
    id: int
    name: str
    description: str | None
    project_id: int
    area_hectares: float
    geometry: dict


class AnalyticsResponse(BaseModel):
    recorded_at: datetime
    carbon_value: float
    biodiversity_score: float
    tree_cover: float
    co2_sequestered: float