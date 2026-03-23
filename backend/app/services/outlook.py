from sqlalchemy.orm import Session
from app.models.email_account import EmailAccount


def _decrypt(value: str, fernet_key: str) -> str:
    if not fernet_key or not value:
        return value
    from cryptography.fernet import Fernet
    return Fernet(fernet_key.encode()).decrypt(value.encode()).decode()


def _get_token(account: EmailAccount) -> str:
    from app.config import settings
    return _decrypt(account.access_token, settings.fernet_key)


class OutlookService:
    GRAPH_BASE = "https://graph.microsoft.com/v1.0/me"

    @staticmethod
    def list_messages(account: EmailAccount, db: Session, max_results: int = 20) -> list[dict]:
        import httpx
        token = _get_token(account)
        r = httpx.get(
            f"{OutlookService.GRAPH_BASE}/messages",
            headers={"Authorization": f"Bearer {token}"},
            params={"$top": max_results, "$orderby": "receivedDateTime desc"},
        )
        r.raise_for_status()
        messages = r.json().get("value", [])
        return [
            {
                "id": m["id"],
                "subject": m.get("subject", "(no subject)"),
                "sender": m.get("from", {}).get("emailAddress", {}).get("address", ""),
                "received_at": m.get("receivedDateTime", ""),
                "is_read": m.get("isRead", False),
                "account": account.email_address,
            }
            for m in messages
        ]

    @staticmethod
    def send_message(account: EmailAccount, to: str, subject: str, body: str, db: Session):
        import httpx
        token = _get_token(account)
        payload = {
            "message": {
                "subject": subject,
                "body": {"contentType": "Text", "content": body},
                "toRecipients": [{"emailAddress": {"address": to}}],
            }
        }
        r = httpx.post(
            f"{OutlookService.GRAPH_BASE}/sendMail",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            json=payload,
        )
        r.raise_for_status()
