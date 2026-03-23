from sqlalchemy import Column, String, DateTime
from app.models.base import Base, TimestampMixin


class SocialPost(Base, TimestampMixin):
    __tablename__ = "social_posts"

    platform = Column(String, nullable=False)       # instagram | twitter | tiktok | linkedin | facebook
    content = Column(String, nullable=False)
    media_urls = Column(String)                     # JSON array
    hashtags = Column(String)                       # JSON array
    status = Column(String, default="draft")        # draft | pending_approval | approved | posted | failed
    approval_item_id = Column(String)
    external_post_id = Column(String)
    scheduled_for = Column(DateTime)
    posted_at = Column(DateTime)
