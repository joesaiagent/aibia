import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models.approval_item import ApprovalItem
from app.models.social_post import SocialPost
from app.api.deps import get_user_id

router = APIRouter()


class ReviewRequest(BaseModel):
    reviewer_note: Optional[str] = None


def approval_to_dict(a: ApprovalItem) -> dict:
    return {
        "id": a.id,
        "type": a.type,
        "status": a.status,
        "title": a.title,
        "description": a.description,
        "payload": json.loads(a.payload) if a.payload else {},
        "reference_id": a.reference_id,
        "reviewed_at": str(a.reviewed_at) if a.reviewed_at else None,
        "reviewer_note": a.reviewer_note,
        "created_at": str(a.created_at),
    }


@router.get("")
def list_approvals(status: Optional[str] = "pending", db: Session = Depends(get_db), user_id: str = Depends(get_user_id)):
    query = db.query(ApprovalItem).filter(ApprovalItem.user_id == user_id)
    if status:
        query = query.filter(ApprovalItem.status == status)
    items = query.order_by(ApprovalItem.created_at.desc()).all()
    return [approval_to_dict(a) for a in items]


@router.get("/count/pending")
def pending_count(db: Session = Depends(get_db), user_id: str = Depends(get_user_id)):
    count = db.query(ApprovalItem).filter(ApprovalItem.status == "pending", ApprovalItem.user_id == user_id).count()
    return {"count": count}


@router.get("/{approval_id}")
def get_approval(approval_id: str, db: Session = Depends(get_db), user_id: str = Depends(get_user_id)):
    item = db.query(ApprovalItem).filter(ApprovalItem.id == approval_id, ApprovalItem.user_id == user_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Approval not found")
    return approval_to_dict(item)


@router.post("/{approval_id}/approve")
def approve(approval_id: str, data: ReviewRequest, db: Session = Depends(get_db), user_id: str = Depends(get_user_id)):
    item = db.query(ApprovalItem).filter(ApprovalItem.id == approval_id, ApprovalItem.user_id == user_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Approval not found")
    if item.status != "pending":
        raise HTTPException(status_code=400, detail=f"Item is already {item.status}")

    item.status = "approved"
    item.reviewed_at = datetime.now(timezone.utc)
    item.reviewer_note = data.reviewer_note

    # Execute the action
    payload = json.loads(item.payload)
    if item.type == "email_send":
        result = _execute_email_send(payload, db)
    elif item.type == "social_post":
        result = _execute_social_post(payload, item, db)
    else:
        result = {"note": "Action approved but no executor registered for this type"}

    db.commit()
    return {"approved": True, "result": result}


@router.post("/{approval_id}/reject")
def reject(approval_id: str, data: ReviewRequest, db: Session = Depends(get_db), user_id: str = Depends(get_user_id)):
    item = db.query(ApprovalItem).filter(ApprovalItem.id == approval_id, ApprovalItem.user_id == user_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Approval not found")
    if item.status != "pending":
        raise HTTPException(status_code=400, detail=f"Item is already {item.status}")

    item.status = "rejected"
    item.reviewed_at = datetime.now(timezone.utc)
    item.reviewer_note = data.reviewer_note

    if item.type == "social_post" and item.reference_id:
        post = db.query(SocialPost).filter(SocialPost.id == item.reference_id).first()
        if post:
            post.status = "draft"

    db.commit()
    return {"rejected": True}


def _execute_email_send(payload: dict, db: Session) -> dict:
    from app.config import settings

    # Try SMTP first (simpler, works with Gmail app password)
    if settings.smtp_host and settings.smtp_user and settings.smtp_password:
        try:
            from app.services.smtp import send_email_smtp
            return send_email_smtp(
                to=payload["to"],
                subject=payload["subject"],
                body=payload["body"],
            )
        except Exception as e:
            return {"error": f"SMTP send failed: {e}"}

    # Fall back to OAuth account
    from app.models.email_account import EmailAccount
    # Try to find the specific account, otherwise use any active one
    account = db.query(EmailAccount).filter(
        EmailAccount.email_address == payload.get("from_account"),
        EmailAccount.is_active == True,
    ).first()
    if not account:
        account = db.query(EmailAccount).filter(EmailAccount.is_active == True).first()
    if not account:
        return {
            "error": "No email configured. Add SMTP_HOST, SMTP_USER, and SMTP_PASSWORD to backend/.env, "
                     "or connect Gmail/Outlook in Settings."
        }

    try:
        if account.provider == "gmail":
            from app.services.gmail import GmailService
            GmailService.send_message(
                account=account,
                to=payload["to"],
                subject=payload["subject"],
                body=payload["body"],
                db=db,
            )
        elif account.provider == "outlook":
            from app.services.outlook import OutlookService
            OutlookService.send_message(
                account=account,
                to=payload["to"],
                subject=payload["subject"],
                body=payload["body"],
                db=db,
            )
        return {"sent": True, "to": payload["to"], "via": account.provider}
    except Exception as e:
        return {"error": str(e)}


def _execute_social_post(payload: dict, item: ApprovalItem, db: Session) -> dict:
    if item.reference_id:
        post = db.query(SocialPost).filter(SocialPost.id == item.reference_id).first()
        if post:
            post.status = "approved"
    # Social platform posting requires developer accounts
    # See backend/.env.example for setup instructions
    return {
        "note": f"Post approved for {payload.get('platform')}. Connect your {payload.get('platform')} account in Settings to enable auto-posting.",
        "content": payload.get("content"),
    }
