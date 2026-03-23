import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models.social_post import SocialPost
from app.models.approval_item import ApprovalItem

router = APIRouter()


class PostCreate(BaseModel):
    platform: str
    content: str
    hashtags: Optional[list[str]] = []
    media_description: Optional[str] = None


class PostUpdate(BaseModel):
    content: Optional[str] = None
    hashtags: Optional[list[str]] = None


def post_to_dict(p: SocialPost) -> dict:
    return {
        "id": p.id,
        "platform": p.platform,
        "content": p.content,
        "hashtags": json.loads(p.hashtags) if p.hashtags else [],
        "status": p.status,
        "approval_item_id": p.approval_item_id,
        "scheduled_for": str(p.scheduled_for) if p.scheduled_for else None,
        "posted_at": str(p.posted_at) if p.posted_at else None,
        "created_at": str(p.created_at),
    }


@router.get("")
def list_posts(platform: Optional[str] = None, status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(SocialPost)
    if platform:
        query = query.filter(SocialPost.platform == platform)
    if status:
        query = query.filter(SocialPost.status == status)
    posts = query.order_by(SocialPost.created_at.desc()).all()
    return [post_to_dict(p) for p in posts]


@router.post("")
def create_post(data: PostCreate, db: Session = Depends(get_db)):
    post = SocialPost(
        platform=data.platform,
        content=data.content,
        hashtags=json.dumps(data.hashtags or []),
        status="pending_approval",
    )
    db.add(post)
    db.flush()

    approval = ApprovalItem(
        type="social_post",
        title=f"Post to {data.platform}: {data.content[:60]}...",
        description="Social post created by user",
        payload=json.dumps({"platform": data.platform, "content": data.content, "hashtags": data.hashtags, "post_id": post.id}),
        reference_id=post.id,
    )
    db.add(approval)
    post.approval_item_id = approval.id
    db.commit()
    db.refresh(post)
    return post_to_dict(post)


@router.patch("/{post_id}")
def update_post(post_id: str, data: PostUpdate, db: Session = Depends(get_db)):
    post = db.query(SocialPost).filter(SocialPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if data.content is not None:
        post.content = data.content
    if data.hashtags is not None:
        post.hashtags = json.dumps(data.hashtags)
    db.commit()
    db.refresh(post)
    return post_to_dict(post)


@router.delete("/{post_id}")
def delete_post(post_id: str, db: Session = Depends(get_db)):
    post = db.query(SocialPost).filter(SocialPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    db.delete(post)
    db.commit()
    return {"deleted": True}
