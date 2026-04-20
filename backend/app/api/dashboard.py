from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.lead import Lead
from app.models.approval_item import ApprovalItem
from app.models.social_post import SocialPost
from app.models.campaign import Campaign
from app.api.deps import get_user_id

router = APIRouter()

PIPELINE_STAGES = ["new", "contacted", "meeting_booked", "client", "closed"]


@router.get("/stats")
def get_stats(db: Session = Depends(get_db), user_id: str = Depends(get_user_id)):
    lead_total = db.query(Lead).filter(Lead.user_id == user_id).count()
    pipeline = {
        s: db.query(Lead).filter(Lead.user_id == user_id, Lead.status == s).count()
        for s in PIPELINE_STAGES
    }

    recent_leads = (
        db.query(Lead)
        .filter(Lead.user_id == user_id)
        .order_by(Lead.created_at.desc())
        .limit(5)
        .all()
    )

    approvals_pending = db.query(ApprovalItem).filter(
        ApprovalItem.user_id == user_id, ApprovalItem.status == "pending"
    ).count()

    active_campaigns = db.query(Campaign).filter(
        Campaign.user_id == user_id, Campaign.status == "active"
    ).count()
    total_campaigns = db.query(Campaign).filter(Campaign.user_id == user_id).count()

    posts_pending = db.query(SocialPost).filter(
        SocialPost.user_id == user_id, SocialPost.status == "pending_approval"
    ).count()
    posts_published = db.query(SocialPost).filter(
        SocialPost.user_id == user_id, SocialPost.status == "posted"
    ).count()

    return {
        "leads": {"total": lead_total, "pipeline": pipeline},
        "approvals": {"pending": approvals_pending},
        "campaigns": {"active": active_campaigns, "total": total_campaigns},
        "posts": {"pending": posts_pending, "published": posts_published},
        "recent_leads": [
            {
                "id": l.id,
                "name": l.name,
                "company": l.company,
                "status": l.status,
                "service_interest": l.service_interest,
                "created_at": str(l.created_at),
            }
            for l in recent_leads
        ],
    }
