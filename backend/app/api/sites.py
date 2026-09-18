import json
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from geoalchemy2 import Geography
from geoalchemy2.shape import from_shape
from shapely.geometry import shape
from sqlalchemy import cast, func
from sqlalchemy.orm import Session

from app.api.auth import require_admin
from app.db.database import get_db
from app.models.models import Project, Site, SiteAnalytics, User
from app.schemas.schemas import (
    AnalyticsResponse,
    SiteCreate,
    SiteResponse,
)


router = APIRouter(
    prefix="/api",
    tags=["Sites & Analytics"],
)


@router.get(
    "/projects/{project_id}/sites",
    response_model=list[SiteResponse],
)
def list_sites(
    project_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_admin),
):
    project = db.get(Project, project_id)

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    rows = (
        db.query(
            Site,
            func.ST_AsGeoJSON(Site.geometry).label("geojson"),
        )
        .filter(Site.project_id == project_id)
        .all()
    )

    return [
        SiteResponse(
            id=site.id,
            name=site.name,
            description=site.description,
            project_id=site.project_id,
            area_hectares=site.area_hectares,
            geometry=json.loads(geojson),
        )
        for site, geojson in rows
    ]


@router.post(
    "/projects/{project_id}/sites",
    response_model=SiteResponse,
)
def create_site(
    project_id: int,
    data: SiteCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_admin),
):
    project = db.get(Project, project_id)

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    geometry = shape(data.geometry)

    if geometry.geom_type != "Polygon":
        raise HTTPException(
            status_code=400,
            detail="Site geometry must be a Polygon",
        )

    if not geometry.is_valid:
        geometry = geometry.buffer(0)

    site = Site(
        name=data.name,
        description=data.description,
        project_id=project_id,
        geometry=from_shape(
            geometry,
            srid=4326,
        ),
    )

    db.add(site)
    db.flush()

    area = db.query(
        func.ST_Area(
            cast(
                site.geometry,
                Geography(srid=4326),
            )
        )
    ).scalar()

    site.area_hectares = float(area or 0) / 10000

    # Create synthetic demo analytics for the new site.
    # These values are for hackathon/demo purposes only.
    base = max(site.area_hectares, 1)

    analytics_data = [
        (2022, 5200, 68, 61, 1100),
        (2023, 6100, 72, 65, 1350),
        (2024, 7050, 76, 69, 1620),
        (2025, 7810, 79, 73, 1880),
        (2026, 8420, 82, 76, 2140),
    ]

    for year, carbon, biodiversity, tree_cover, co2 in analytics_data:
        db.add(
            SiteAnalytics(
                site_id=site.id,
                recorded_at=datetime(year, 1, 1),
                carbon_value=round(carbon * (base / 1000), 2),
                biodiversity_score=biodiversity,
                tree_cover=tree_cover,
                co2_sequestered=round(co2 * (base / 1000), 2),
            )
        )

    db.commit()
    db.refresh(site)

    geojson = db.query(
        func.ST_AsGeoJSON(site.geometry)
    ).scalar()

    return SiteResponse(
        id=site.id,
        name=site.name,
        description=site.description,
        project_id=site.project_id,
        area_hectares=site.area_hectares,
        geometry=json.loads(geojson),
    )

@router.get(
    "/sites/{site_id}/analytics",
    response_model=list[AnalyticsResponse],
)
def get_analytics(
    site_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_admin),
):
    site = db.get(Site, site_id)

    if not site:
        raise HTTPException(
            status_code=404,
            detail="Site not found",
        )

    analytics = (
        db.query(SiteAnalytics)
        .filter(
            SiteAnalytics.site_id == site_id
        )
        .order_by(
            SiteAnalytics.recorded_at
        )
        .all()
    )

    return analytics