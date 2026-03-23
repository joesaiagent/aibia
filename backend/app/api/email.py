import json
import secrets
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.email_account import EmailAccount
from app.models.email_message import EmailMessage
from app.config import settings

router = APIRouter()

# In-memory CSRF state store (keyed by state token)
_oauth_states: dict[str, dict] = {}


def account_to_dict(a: EmailAccount) -> dict:
    return {
        "id": a.id,
        "provider": a.provider,
        "email_address": a.email_address,
        "display_name": a.display_name,
        "is_active": a.is_active,
        "created_at": str(a.created_at),
    }


@router.get("/accounts")
def list_accounts(db: Session = Depends(get_db)):
    accounts = db.query(EmailAccount).filter(EmailAccount.is_active == True).all()
    return [account_to_dict(a) for a in accounts]


@router.delete("/accounts/{account_id}")
def disconnect_account(account_id: str, db: Session = Depends(get_db)):
    account = db.query(EmailAccount).filter(EmailAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    account.is_active = False
    db.commit()
    return {"disconnected": True}


@router.get("/oauth/initiate")
def initiate_oauth(provider: str):
    if provider not in ("gmail", "outlook"):
        raise HTTPException(status_code=400, detail="Provider must be gmail or outlook")

    state = secrets.token_urlsafe(32)
    _oauth_states[state] = {"provider": provider, "created_at": datetime.now(timezone.utc).isoformat()}

    if provider == "gmail":
        if not settings.google_client_id:
            raise HTTPException(
                status_code=503,
                detail="Gmail not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to backend/.env."
            )
        import urllib.parse
        params = {
            "client_id": settings.google_client_id,
            "redirect_uri": settings.google_redirect_uri,
            "response_type": "code",
            "scope": " ".join([
                "https://www.googleapis.com/auth/gmail.readonly",
                "https://www.googleapis.com/auth/gmail.compose",
                "https://www.googleapis.com/auth/gmail.send",
                "https://www.googleapis.com/auth/userinfo.email",
                "openid",
            ]),
            "state": state,
            "access_type": "offline",
            "prompt": "consent",
        }
        auth_url = "https://accounts.google.com/o/oauth2/v2/auth?" + urllib.parse.urlencode(params)
        return {"auth_url": auth_url}

    elif provider == "outlook":
        if not settings.microsoft_client_id:
            raise HTTPException(
                status_code=503,
                detail="Outlook not configured. Add MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET to backend/.env. Set up at https://portal.azure.com"
            )
        import msal
        app = msal.ConfidentialClientApplication(
            settings.microsoft_client_id,
            authority=f"https://login.microsoftonline.com/{settings.microsoft_tenant_id}",
            client_credential=settings.microsoft_client_secret,
        )
        auth_url = app.get_authorization_request_url(
            scopes=["Mail.ReadWrite", "Mail.Send", "offline_access", "User.Read"],
            state=state,
            redirect_uri=settings.microsoft_redirect_uri,
        )
        return {"auth_url": auth_url}


@router.get("/oauth/callback")
def oauth_callback(code: str, state: str, provider: str = None, db: Session = Depends(get_db)):
    state_data = _oauth_states.pop(state, None)
    if not state_data:
        raise HTTPException(status_code=400, detail="Invalid or expired OAuth state")

    prov = provider or state_data["provider"]

    try:
        if prov == "gmail":
            account = _handle_gmail_callback(code, state_data, db)
        elif prov == "outlook":
            account = _handle_outlook_callback(code, db)
        else:
            raise HTTPException(status_code=400, detail="Unknown provider")
    except Exception as e:
        from app.config import settings as cfg
        return RedirectResponse(url=f"{cfg.frontend_url}/settings?error={str(e)}")

    from app.config import settings as cfg
    return RedirectResponse(url=f"{cfg.frontend_url}/settings?connected={prov}&email={account.email_address}")


def _handle_gmail_callback(code: str, state_data: dict, db: Session) -> EmailAccount:
    import urllib.parse
    import urllib.request
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build

    # Exchange code for tokens directly via HTTP to avoid PKCE issues
    token_data = {
        "code": code,
        "client_id": settings.google_client_id,
        "client_secret": settings.google_client_secret,
        "redirect_uri": settings.google_redirect_uri,
        "grant_type": "authorization_code",
    }
    import httpx
    resp = httpx.post("https://oauth2.googleapis.com/token", data=token_data)
    if resp.status_code != 200:
        raise Exception(f"Google token error: {resp.json()}")
    tokens = resp.json()

    creds = Credentials(
        token=tokens["access_token"],
        refresh_token=tokens.get("refresh_token"),
        token_uri="https://oauth2.googleapis.com/token",
        client_id=settings.google_client_id,
        client_secret=settings.google_client_secret,
    )

    service = build("oauth2", "v2", credentials=creds)
    user_info = service.userinfo().get().execute()
    email = user_info["email"]
    name = user_info.get("name", email)

    encrypted_access = _encrypt(creds.token)
    encrypted_refresh = _encrypt(creds.refresh_token or "")

    existing = db.query(EmailAccount).filter(EmailAccount.email_address == email).first()
    if existing:
        existing.access_token = encrypted_access
        existing.refresh_token = encrypted_refresh
        existing.is_active = True
        db.commit()
        return existing

    account = EmailAccount(
        provider="gmail",
        email_address=email,
        display_name=name,
        access_token=encrypted_access,
        refresh_token=encrypted_refresh,
        token_expiry=creds.expiry,
        scopes=json.dumps(list(creds.scopes or [])),
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


def _handle_outlook_callback(code: str, db: Session) -> EmailAccount:
    import msal
    import httpx

    app = msal.ConfidentialClientApplication(
        settings.microsoft_client_id,
        authority=f"https://login.microsoftonline.com/{settings.microsoft_tenant_id}",
        client_credential=settings.microsoft_client_secret,
    )
    result = app.acquire_token_by_authorization_code(
        code,
        scopes=["Mail.ReadWrite", "Mail.Send", "offline_access", "User.Read"],
        redirect_uri=settings.microsoft_redirect_uri,
    )
    if "error" in result:
        raise Exception(result.get("error_description", "Outlook OAuth failed"))

    access_token = result["access_token"]
    refresh_token = result.get("refresh_token", "")

    r = httpx.get("https://graph.microsoft.com/v1.0/me", headers={"Authorization": f"Bearer {access_token}"})
    r.raise_for_status()
    user = r.json()
    email = user.get("mail") or user.get("userPrincipalName")
    name = user.get("displayName", email)

    encrypted_access = _encrypt(access_token)
    encrypted_refresh = _encrypt(refresh_token)

    existing = db.query(EmailAccount).filter(EmailAccount.email_address == email).first()
    if existing:
        existing.access_token = encrypted_access
        existing.refresh_token = encrypted_refresh
        existing.is_active = True
        db.commit()
        return existing

    account = EmailAccount(
        provider="outlook",
        email_address=email,
        display_name=name,
        access_token=encrypted_access,
        refresh_token=encrypted_refresh,
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


def _encrypt(value: str) -> str:
    if not settings.fernet_key or not value:
        return value
    from cryptography.fernet import Fernet
    return Fernet(settings.fernet_key.encode()).encrypt(value.encode()).decode()


@router.get("/inbox")
def get_inbox(db: Session = Depends(get_db)):
    """Fetch and cache latest emails from all connected accounts."""
    accounts = db.query(EmailAccount).filter(EmailAccount.is_active == True).all()
    all_messages = []

    for account in accounts:
        try:
            if account.provider == "gmail":
                from app.services.gmail import GmailService
                msgs = GmailService.list_messages(account, db, max_results=20)
            elif account.provider == "outlook":
                from app.services.outlook import OutlookService
                msgs = OutlookService.list_messages(account, db, max_results=20)
            else:
                msgs = []
            all_messages.extend(msgs)
        except Exception as e:
            all_messages.append({"error": str(e), "account": account.email_address})

    all_messages.sort(key=lambda m: m.get("received_at", ""), reverse=True)
    return all_messages
