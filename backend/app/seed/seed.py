from datetime import datetime

from shapely.geometry import Polygon
from geoalchemy2.shape import from_shape

from app.core.security import hash_password
from app.db.database import SessionLocal
from app.models.models import (
    Project,
    Site,
    SiteAnalytics,
    User,
)


def seed():
    db = SessionLocal()

    try:
        # Clear existing demo data
        db.query(SiteAnalytics).delete()
        db.query(Site).delete()
        db.query(Project).delete()
        db.query(User).delete()
        db.commit()

        # Admin
        admin = User(
            name="Darukaa Admin",
            email="admin@darukaa.earth",
            password_hash=hash_password("Darukaa@123"),
            role="ADMIN",
        )

        db.add(admin)
        db.flush()

        # Projects
        projects = [
            Project(
                name="Western Ghats Restoration",
                description="Forest restoration and biodiversity monitoring across the Western Ghats.",
                project_type="Carbon & Biodiversity",
                status="Active",
                owner_id=admin.id,
            ),
            Project(
                name="Maharashtra Reforestation",
                description="Reforestation monitoring across selected Maharashtra landscapes.",
                project_type="Reforestation",
                status="Active",
                owner_id=admin.id,
            ),
            Project(
                name="Biodiversity Conservation",
                description="Long-term biodiversity and ecosystem performance monitoring.",
                project_type="Biodiversity",
                status="Planning",
                owner_id=admin.id,
            ),
        ]

        db.add_all(projects)
        db.flush()

        # Synthetic site polygons
        site_data = [
            (
                projects[0],
                "Tamhini Forest Site",
                "Synthetic monitoring site near the Tamhini landscape.",
                [
                    (73.450, 18.470),
                    (73.485, 18.470),
                    (73.485, 18.500),
                    (73.450, 18.500),
                    (73.450, 18.470),
                ],
            ),
            (
                projects[0],
                "Mulshi Conservation Site",
                "Synthetic forest conservation monitoring area.",
                [
                    (73.520, 18.520),
                    (73.555, 18.520),
                    (73.555, 18.550),
                    (73.520, 18.550),
                    (73.520, 18.520),
                ],
            ),
            (
                projects[1],
                "Bhimashankar Restoration Site",
                "Synthetic reforestation monitoring area.",
                [
                    (73.520, 19.050),
                    (73.555, 19.050),
                    (73.555, 19.080),
                    (73.520, 19.080),
                    (73.520, 19.050),
                ],
            ),
            (
                projects[1],
                "Maval Forest Site",
                "Synthetic forest restoration monitoring area.",
                [
                    (73.600, 18.700),
                    (73.635, 18.700),
                    (73.635, 18.730),
                    (73.600, 18.730),
                    (73.600, 18.700),
                ],
            ),
            (
                projects[2],
                "Koyna Biodiversity Site",
                "Synthetic biodiversity monitoring area.",
                [
                    (73.720, 17.380),
                    (73.755, 17.380),
                    (73.755, 17.410),
                    (73.720, 17.410),
                    (73.720, 17.380),
                ],
            ),
        ]

        analytics_values = [
            (2022, 5200, 68, 61, 1100),
            (2023, 6100, 72, 65, 1350),
            (2024, 7050, 76, 69, 1620),
            (2025, 7810, 79, 73, 1880),
            (2026, 8420, 82, 76, 2140),
        ]

        for project, name, description, coordinates in site_data:
            polygon = Polygon(coordinates)

            site = Site(
                name=name,
                description=description,
                project_id=project.id,
                geometry=from_shape(
                    polygon,
                    srid=4326,
                ),
                area_hectares=0,
            )

            db.add(site)
            db.flush()

            # Calculate area using PostGIS
            from sqlalchemy import cast, func
            from geoalchemy2 import Geography

            area = db.query(
                func.ST_Area(
                    cast(
                        site.geometry,
                        Geography(srid=4326),
                    )
                )
            ).scalar()

            site.area_hectares = float(area or 0) / 10000

            for year, carbon, biodiversity, tree_cover, co2 in analytics_values:
                analytics = SiteAnalytics(
                    site_id=site.id,
                    recorded_at=datetime(year, 6, 1),
                    carbon_value=carbon,
                    biodiversity_score=biodiversity,
                    tree_cover=tree_cover,
                    co2_sequestered=co2,
                )

                db.add(analytics)

        db.commit()

        print("====================================")
        print("Darukaa.Earth seed completed")
        print("====================================")
        print("Admin:")
        print("Email: admin@darukaa.earth")
        print("Password: Darukaa@123")
        print("------------------------------------")
        print(f"Projects: {len(projects)}")
        print(f"Sites: {len(site_data)}")
        print("Analytics: 5 years per site")
        print("====================================")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed()