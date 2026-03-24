from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin


class Lead(Base, TimestampMixin):
    __tablename__ = "leads"

    user_id = Column(String, nullable=True, index=True)
    name = Column(String, nullable=False)
    company = Column(String)
    email = Column(String)
    phone = Column(String)
    website = Column(String)
    linkedin_url = Column(String)
    source = Column(String, default="manual")  # web_search | manual | email_import
    status = Column(String, default="new")     # new | contacted | qualified | won | lost
    score = Column(Integer)
    notes = Column(String)
    last_contacted_at = Column(DateTime)

    lead_notes = relationship("LeadNote", back_populates="lead", cascade="all, delete-orphan")


class LeadNote(Base, TimestampMixin):
    __tablename__ = "lead_notes"

    lead_id = Column(String, ForeignKey("leads.id", ondelete="CASCADE"), nullable=False)
    content = Column(String, nullable=False)
    source = Column(String, default="user")  # agent | user

    lead = relationship("Lead", back_populates="lead_notes")
