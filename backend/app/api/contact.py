import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models.lead import Lead, LeadNote
from app.config import settings

router = APIRouter()


class ContactForm(BaseModel):
    name: str
    company: str
    email: str
    service_interest: Optional[str] = None
    business_type: Optional[str] = None
    message: str = ""
    # legacy fields from old form
    team_size: Optional[str] = None


@router.post("/contact")
async def submit_contact(form: ContactForm, db: Session = Depends(get_db)):
    # Save as lead in the database (owner's account)
    owner_id = settings.owner_user_id
    if owner_id:
        lead = Lead(
            user_id=owner_id,
            name=form.name,
            company=form.company,
            email=form.email,
            source="contact_form",
            status="new",
            service_interest=form.service_interest or form.team_size,
            notes=form.message or None,
        )
        db.add(lead)
        db.flush()
        if form.message:
            note = LeadNote(lead_id=lead.id, content=f"Contact form message: {form.message}", source="user")
            db.add(note)
        db.commit()

    # Send email notification
    body = f"""New consultation inquiry from aibia.io:

Name:             {form.name}
Company:          {form.company}
Email:            {form.email}
Service Interest: {form.service_interest or form.team_size or "—"}
Message:          {form.message or "—"}
"""
    if settings.smtp_user and settings.smtp_password:
        try:
            msg = MIMEMultipart()
            msg["From"] = settings.smtp_user
            msg["To"] = settings.smtp_user
            msg["Subject"] = f"New aibia inquiry — {form.company}"
            msg.attach(MIMEText(body, "plain"))
            with smtplib.SMTP(settings.smtp_host or "smtp.gmail.com", settings.smtp_port) as server:
                server.starttls()
                server.login(settings.smtp_user, settings.smtp_password)
                server.sendmail(settings.smtp_user, settings.smtp_user, msg.as_string())
        except Exception as e:
            print(f"Contact email failed: {e}")

    return {"ok": True}
