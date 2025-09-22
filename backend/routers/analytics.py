from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Dict

from .. import database, security

router = APIRouter()

class AnalyticsEventCreate(BaseModel):
    session_id: str
    event_type: str
    url: str
    details: Optional[Dict] = None

@router.post("/track")
async def track_event(
    event: AnalyticsEventCreate,
    request: Request,
    db: Session = Depends(database.get_db),
    current_user: Optional[database.User] = Depends(security.get_current_user_optional)
):
    """
    Enregistre un événement d'analyse (pageview, click, etc.).
    """
    user_id = current_user.id if current_user else None
    
    db_event = database.AnalyticsEvent(
        session_id=event.session_id,
        user_id=user_id,
        event_type=event.event_type,
        url=event.url,
        details=event.details,
    )
    db.add(db_event)
    db.commit()
    
    return {"success": True}