from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.lead import Lead
from app.models.approval_item import ApprovalItem
from app.models.social_post import SocialPost
from app.models.email_account import EmailAccount
from app.api.deps import get_user_id

router = APIRouter()


@router.get("/stats")
def get_stats(db: Session = Depends(get_db), user_id: str = Depends(get_user_id)):
    lead_total = db.query(Lead).filter(Lead.user_id == user_id).count()
    lead_by_status = {
        s: db.query(Lead).filter(Lead.user_id == user_id, Lead.status == s).count()
        for s in ["new", "contacted", "qualified", "won", "lost"]
    }

    approvals_pending = db.query(ApprovalItem).filter(ApprovalItem.user_id == user_id, ApprovalItem.status == "pending").count()
    approvals_total = db.query(ApprovalItem).filter(ApprovalItem.user_id == user_id).count()

    social_drafts = db.query(SocialPost).filter(SocialPost.user_id == user_id, SocialPost.status == "draft").count()
    social_pending = db.query(SocialPost).filter(SocialPost.user_id == user_id, SocialPost.status == "pending_approval").count()
    social_posted = db.query(SocialPost).filter(SocialPost.user_id == user_id, SocialPost.status == "posted").count()

    connected_emails = db.query(EmailAccount).filter(EmailAccount.user_id == user_id, EmailAccount.is_active == True).count()

    return {
        "leads": {"total": lead_total, **lead_by_status},
        "approvals": {"pending": approvals_pending, "total": approvals_total},
        "social": {"drafts": social_drafts, "pending_approval": social_pending, "posted": social_posted},
        "email": {"connected_accounts": connected_emails},
    }
