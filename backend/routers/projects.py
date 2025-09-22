from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from database import get_db, Project
from datetime import datetime

router = APIRouter()

# Modèles Pydantic
class ProjectCreate(BaseModel):
    title: str
    description: Optional[str] = None
    technology: Optional[str] = None
    client: Optional[str] = None

class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    technology: Optional[str] = None
    client: Optional[str] = None
    status: Optional[str] = None

class ProjectResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    technology: Optional[str]
    client: Optional[str]
    status: str
    created_at: datetime
    updated_at: datetime

@router.get("/", response_model=List[ProjectResponse])
async def get_projects(
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Récupérer la liste des projets"""
    query = db.query(Project)
    
    if status:
        query = query.filter(Project.status == status)
    
    projects = query.offset(skip).limit(limit).all()
    return projects

@router.post("/", response_model=ProjectResponse)
async def create_project(
    project: ProjectCreate,
    db: Session = Depends(get_db)
):
    """Créer un nouveau projet"""
    db_project = Project(
        title=project.title,
        description=project.description,
        technology=project.technology,
        client=project.client,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    
    return db_project

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: int, db: Session = Depends(get_db)):
    """Récupérer un projet spécifique"""
    project = db.query(Project).filter(Project.id == project_id).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Projet non trouvé")
    
    return project

@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: int,
    project_update: ProjectUpdate,
    db: Session = Depends(get_db)
):
    """Mettre à jour un projet"""
    project = db.query(Project).filter(Project.id == project_id).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Projet non trouvé")
    
    # Mettre à jour les champs modifiés
    update_data = project_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)
    
    project.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(project)
    
    return project

@router.delete("/{project_id}")
async def delete_project(project_id: int, db: Session = Depends(get_db)):
    """Supprimer un projet"""
    project = db.query(Project).filter(Project.id == project_id).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Projet non trouvé")
    
    db.delete(project)
    db.commit()
    
    return {"message": "Projet supprimé avec succès"}

@router.get("/stats/overview")
async def get_project_stats(db: Session = Depends(get_db)):
    """Statistiques des projets"""
    total_projects = db.query(Project).count()
    active_projects = db.query(Project).filter(Project.status == "en_cours").count()
    completed_projects = db.query(Project).filter(Project.status == "terminé").count()
    
    return {
        "total": total_projects,
        "active": active_projects,
        "completed": completed_projects,
        "completion_rate": (completed_projects / total_projects * 100) if total_projects > 0 else 0
    }