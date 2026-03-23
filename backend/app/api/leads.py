from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models.lead import Lead, LeadNote

router = APIRouter()


class LeadCreate(BaseModel):
    name: str
    company: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    linkedin_url: Optional[str] = None
    source: Optional[str] = "manual"
    notes: Optional[str] = None


class LeadUpdate(BaseModel):
    name: Optional[str] = None
    company: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    linkedin_url: Optional[str] = None
    status: Optional[str] = None
    score: Optional[int] = None
    notes: Optional[str] = None


class NoteCreate(BaseModel):
    content: str


def lead_to_dict(lead: Lead) -> dict:
    return {
        "id": lead.id,
        "name": lead.name,
        "company": lead.company,
        "email": lead.email,
        "phone": lead.phone,
        "website": lead.website,
        "linkedin_url": lead.linkedin_url,
        "source": lead.source,
        "status": lead.status,
        "score": lead.score,
        "notes": lead.notes,
        "created_at": str(lead.created_at),
        "updated_at": str(lead.updated_at),
    }


@router.get("")
def list_leads(
    search: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Lead)
    if status:
        query = query.filter(Lead.status == status)
    if search:
        q = f"%{search}%"
        query = query.filter(Lead.name.ilike(q) | Lead.company.ilike(q) | Lead.email.ilike(q))
    leads = query.order_by(Lead.created_at.desc()).all()
    return [lead_to_dict(l) for l in leads]


@router.post("")
def create_lead(data: LeadCreate, db: Session = Depends(get_db)):
    lead = Lead(**data.model_dump())
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead_to_dict(lead)


@router.get("/{lead_id}")
def get_lead(lead_id: str, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    result = lead_to_dict(lead)
    result["lead_notes"] = [
        {"id": n.id, "content": n.content, "source": n.source, "created_at": str(n.created_at)}
        for n in lead.lead_notes
    ]
    return result


@router.patch("/{lead_id}")
def update_lead(lead_id: str, data: LeadUpdate, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(lead, field, value)
    db.commit()
    db.refresh(lead)
    return lead_to_dict(lead)


@router.delete("/{lead_id}")
def delete_lead(lead_id: str, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    db.delete(lead)
    db.commit()
    return {"deleted": True}


@router.post("/{lead_id}/notes")
def add_note(lead_id: str, data: NoteCreate, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    note = LeadNote(lead_id=lead_id, content=data.content, source="user")
    db.add(note)
    db.commit()
    db.refresh(note)
    return {"id": note.id, "content": note.content, "source": note.source}
