import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings


def send_email_smtp(to: str, subject: str, body: str) -> dict:
    if not settings.smtp_host or not settings.smtp_user or not settings.smtp_password:
        return {
            "error": "SMTP not configured. Add SMTP_HOST, SMTP_USER, and SMTP_PASSWORD to backend/.env. "
                     "For Gmail: enable 2FA then generate an App Password at myaccount.google.com/apppasswords"
        }

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{settings.smtp_from_name} <{settings.smtp_user}>"
    msg["To"] = to
    msg.attach(MIMEText(body, "plain"))

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
        server.ehlo()
        server.starttls()
        server.login(settings.smtp_user, settings.smtp_password)
        server.sendmail(settings.smtp_user, to, msg.as_string())

    return {"sent": True, "to": to, "via": "smtp"}
