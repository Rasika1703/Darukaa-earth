from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, projects, sites
from app.db.database import Base, engine
from app.models import models


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Darukaa.Earth API",
    description="Geospatial carbon and biodiversity analytics platform",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
   allow_origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  "https://darukaa-earth-peach.vercel.app",
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(sites.router)


@app.get("/")
def root():
    return {
        "name": "Darukaa.Earth API",
        "status": "running",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
    }
