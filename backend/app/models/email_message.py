from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from app.models.base import Base, TimestampMixin


class EmailMessage(Base, TimestampMixin):
    __tablename__ = "email_messages"

    account_id = Column(String, ForeignKey("email_accounts.id"), nullable=False)
    external_id = Column(String, nullable=False)
    thread_id = Column(String)
    subject = Column(String)
    sender = Column(String, nullable=False)
    recipients = Column(String)   # JSON array
    body_text = Column(String)
    body_html = Column(String)
    is_read = Column(Boolean, default=False)
    received_at = Column(DateTime)
    lead_id = Column(String, ForeignKey("leads.id"))
