import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi import APIRouter
from pydantic import BaseModel
from app.config import settings

router = APIRouter()


class ContactForm(BaseModel):
    name: str
    company: str
    email: str
    team_size: str
    message: str = ""


@router.post("/contact")
async def submit_contact(form: ContactForm):
    body = f"""
New aibia Business inquiry:

Name:      {form.name}
Company:   {form.company}
Email:     {form.email}
Team size: {form.team_size}
Message:   {form.message or "—"}
"""
    if settings.smtp_user and settings.smtp_password:
        try:
            msg = MIMEMultipart()
            msg["From"] = settings.smtp_user
            msg["To"] = settings.smtp_user
            msg["Subject"] = f"aibia Business inquiry — {form.company}"
            msg.attach(MIMEText(body, "plain"))
            with smtplib.SMTP(settings.smtp_host or "smtp.gmail.com", settings.smtp_port) as server:
                server.starttls()
                server.login(settings.smtp_user, settings.smtp_password)
                server.sendmail(settings.smtp_user, settings.smtp_user, msg.as_string())
        except Exception as e:
            print(f"Contact email failed: {e}")

    return {"ok": True}
