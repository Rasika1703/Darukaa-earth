from datetime import datetime

from geoalchemy2 import Geometry
from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    role: Mapped[str] = mapped_column(
        String(30),
        default="ADMIN",
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    projects = relationship(
        "Project",
        back_populates="owner",
    )


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    project_type: Mapped[str] = mapped_column(
        String(100),
        default="Carbon & Biodiversity",
    )

    status: Mapped[str] = mapped_column(
        String(50),
        default="Active",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    owner_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
    )

    owner = relationship(
        "User",
        back_populates="projects",
    )

    sites = relationship(
        "Site",
        back_populates="project",
        cascade="all, delete-orphan",
    )


class Site(Base):
    __tablename__ = "sites"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.id"),
        index=True,
    )

    geometry = mapped_column(
        Geometry(
            geometry_type="POLYGON",
            srid=4326,
        ),
        nullable=False,
    )

    area_hectares: Mapped[float] = mapped_column(
        Float,
        default=0,
    )

    project = relationship(
        "Project",
        back_populates="sites",
    )

    analytics = relationship(
        "SiteAnalytics",
        back_populates="site",
        cascade="all, delete-orphan",
    )


class SiteAnalytics(Base):
    __tablename__ = "site_analytics"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    site_id: Mapped[int] = mapped_column(
        ForeignKey("sites.id"),
        index=True,
    )

    recorded_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
    )

    carbon_value: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    biodiversity_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    tree_cover: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    co2_sequestered: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    site = relationship(
        "Site",
        back_populates="analytics",
    )