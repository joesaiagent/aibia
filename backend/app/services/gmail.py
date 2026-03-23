import json
import base64
from email.mime.text import MIMEText
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.email_account import EmailAccount
from app.models.email_message import EmailMessage


def _decrypt(value: str, fernet_key: str) -> str:
    if not fernet_key or not value:
        return value
    from cryptography.fernet import Fernet
    return Fernet(fernet_key.encode()).decrypt(value.encode()).decode()


def _get_credentials(account: EmailAccount):
    from google.oauth2.credentials import Credentials
    from app.config import settings
    access_token = _decrypt(account.access_token, settings.fernet_key)
    refresh_token = _decrypt(account.refresh_token, settings.fernet_key)
    return Credentials(
        token=access_token,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=settings.google_client_id,
        client_secret=settings.google_client_secret,
    )


class GmailService:
    @staticmethod
    def list_messages(account: EmailAccount, db: Session, max_results: int = 20) -> list[dict]:
        from googleapiclient.discovery import build
        creds = _get_credentials(account)
        service = build("gmail", "v1", credentials=creds)
        result = service.users().messages().list(userId="me", maxResults=max_results).execute()
        messages = result.get("messages", [])
        out = []
        for msg_ref in messages:
            msg = service.users().messages().get(userId="me", id=msg_ref["id"], format="metadata",
                metadataHeaders=["Subject", "From", "To", "Date"]).execute()
            headers = {h["name"]: h["value"] for h in msg.get("payload", {}).get("headers", [])}
            out.append({
                "id": msg_ref["id"],
                "subject": headers.get("Subject", "(no subject)"),
                "sender": headers.get("From", ""),
                "received_at": headers.get("Date", ""),
                "is_read": "UNREAD" not in msg.get("labelIds", []),
                "account": account.email_address,
            })
        return out

    @staticmethod
    def send_message(account: EmailAccount, to: str, subject: str, body: str, db: Session, reply_to_id: str = None):
        from googleapiclient.discovery import build
        creds = _get_credentials(account)
        service = build("gmail", "v1", credentials=creds)
        message = MIMEText(body)
        message["to"] = to
        message["subject"] = subject
        raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
        service.users().messages().send(userId="me", body={"raw": raw}).execute()
