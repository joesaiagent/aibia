from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin


class Campaign(Base, TimestampMixin):
    __tablename__ = "campaigns"

    user_id = Column(String, nullable=False, index=True)
    client_id = Column(String, ForeignKey("leads.id"), nullable=True)
    name = Column(String, nullable=False)
    platforms = Column(String, default="[]")   # JSON array: instagram | facebook | linkedin | twitter | tiktok
    status = Column(String, default="draft")   # draft | active | paused | completed
    campaign_brief = Column(String)
    start_date = Column(String)
    end_date = Column(String)
    budget = Column(String)
    notes = Column(String)

    client = relationship("Lead", back_populates="campaigns")
    posts = relationship("SocialPost", back_populates="campaign")
