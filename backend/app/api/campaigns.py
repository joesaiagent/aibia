import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional, List
from anthropic import Anthropic
from app.database import get_db
from app.models.campaign import Campaign
from app.models.social_post import SocialPost
from app.models.approval_item import ApprovalItem
from app.models.lead import Lead
from app.api.deps import get_user_id
from app.config import settings

router = APIRouter()
_anthropic = Anthropic(api_key=settings.anthropic_api_key)


class CampaignCreate(BaseModel):
    name: str
    client_id: Optional[str] = None
    platforms: Optional[List[str]] = []
    campaign_brief: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    budget: Optional[str] = None
    notes: Optional[str] = None


class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    client_id: Optional[str] = None
    platforms: Optional[List[str]] = None
    status: Optional[str] = None
    campaign_brief: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    budget: Optional[str] = None
    notes: Optional[str] = None


def campaign_to_dict(c: Campaign, post_count: int = 0) -> dict:
    return {
        "id": c.id,
        "name": c.name,
        "client_id": c.client_id,
        "client_name": c.client.name if c.client else None,
        "client_company": c.client.company if c.client else None,
        "platforms": json.loads(c.platforms) if c.platforms else [],
        "status": c.status,
        "campaign_brief": c.campaign_brief,
        "start_date": c.start_date,
        "end_date": c.end_date,
        "budget": c.budget,
        "notes": c.notes,
        "post_count": post_count,
        "created_at": str(c.created_at),
        "updated_at": str(c.updated_at),
    }


def post_to_dict(p: SocialPost) -> dict:
    return {
        "id": p.id,
        "platform": p.platform,
        "content": p.content,
        "hashtags": json.loads(p.hashtags) if p.hashtags else [],
        "status": p.status,
        "campaign_id": p.campaign_id,
        "approval_item_id": p.approval_item_id,
        "created_at": str(p.created_at),
    }


@router.get("")
def list_campaigns(db: Session = Depends(get_db), user_id: str = Depends(get_user_id)):
    campaigns = db.query(Campaign).filter(Campaign.user_id == user_id).order_by(Campaign.created_at.desc()).all()
    result = []
    for c in campaigns:
        post_count = db.query(SocialPost).filter(SocialPost.campaign_id == c.id).count()
        result.append(campaign_to_dict(c, post_count))
    return result


@router.post("")
def create_campaign(data: CampaignCreate, db: Session = Depends(get_db), user_id: str = Depends(get_user_id)):
    platforms_json = json.dumps(data.platforms or [])
    campaign = Campaign(
        user_id=user_id,
        client_id=data.client_id,
        name=data.name,
        platforms=platforms_json,
        campaign_brief=data.campaign_brief,
        start_date=data.start_date,
        end_date=data.end_date,
        budget=data.budget,
        notes=data.notes,
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return campaign_to_dict(campaign)


@router.get("/{campaign_id}")
def get_campaign(campaign_id: str, db: Session = Depends(get_db), user_id: str = Depends(get_user_id)):
    c = db.query(Campaign).filter(Campaign.id == campaign_id, Campaign.user_id == user_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")
    posts = db.query(SocialPost).filter(SocialPost.campaign_id == campaign_id).order_by(SocialPost.created_at.desc()).all()
    result = campaign_to_dict(c, len(posts))
    result["posts"] = [post_to_dict(p) for p in posts]
    return result


@router.patch("/{campaign_id}")
def update_campaign(campaign_id: str, data: CampaignUpdate, db: Session = Depends(get_db), user_id: str = Depends(get_user_id)):
    c = db.query(Campaign).filter(Campaign.id == campaign_id, Campaign.user_id == user_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")
    update_data = data.model_dump(exclude_none=True)
    if "platforms" in update_data:
        update_data["platforms"] = json.dumps(update_data["platforms"])
    for field, value in update_data.items():
        setattr(c, field, value)
    db.commit()
    db.refresh(c)
    return campaign_to_dict(c)


@router.delete("/{campaign_id}")
def delete_campaign(campaign_id: str, db: Session = Depends(get_db), user_id: str = Depends(get_user_id)):
    c = db.query(Campaign).filter(Campaign.id == campaign_id, Campaign.user_id == user_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")
    db.delete(c)
    db.commit()
    return {"deleted": True}


@router.post("/{campaign_id}/generate")
def generate_posts(campaign_id: str, db: Session = Depends(get_db), user_id: str = Depends(get_user_id)):
    c = db.query(Campaign).filter(Campaign.id == campaign_id, Campaign.user_id == user_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")

    platforms = json.loads(c.platforms) if c.platforms else ["instagram"]
    client_name = c.client.company or c.client.name if c.client else "the business"
    business_type = c.client.business_type if c.client else "local business"

    prompt = f"""Generate social media posts for a local business marketing campaign.

Business: {client_name}
Business Type: {business_type}
Campaign: {c.name}
Brief: {c.campaign_brief or "Promote the business to local community"}
Platforms: {", ".join(platforms)}

Generate one post per platform. Each post should be authentic, local, community-focused.
Include relevant hashtags. Mix promotional with community/value content.

Return as JSON array:
[
  {{"platform": "instagram", "content": "post text here", "hashtags": ["tag1", "tag2"]}},
  ...
]

Return ONLY the JSON array, no other text."""

    message = _anthropic.messages.create(
        model="claude-opus-4-6",
        max_tokens=1000,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = message.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    posts_data = json.loads(raw)
    created = []

    for post_data in posts_data:
        platform = post_data.get("platform", "instagram")
        if platform not in platforms:
            continue
        content = post_data.get("content", "")
        hashtags = json.dumps(post_data.get("hashtags", []))

        # Create approval item
        approval = ApprovalItem(
            user_id=user_id,
            type="social_post",
            status="pending",
            title=f"{platform.capitalize()} post for {client_name}",
            description=content[:100] + "..." if len(content) > 100 else content,
            payload=json.dumps({"platform": platform, "content": content, "hashtags": post_data.get("hashtags", []), "campaign_id": campaign_id}),
        )
        db.add(approval)
        db.flush()

        post = SocialPost(
            user_id=user_id,
            platform=platform,
            content=content,
            hashtags=hashtags,
            status="pending_approval",
            campaign_id=campaign_id,
            client_id=c.client_id,
            approval_item_id=approval.id,
        )
        db.add(post)
        created.append(post)

    db.commit()
    return {"generated": len(created), "posts": [post_to_dict(p) for p in created]}
