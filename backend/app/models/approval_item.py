from sqlalchemy import Column, String, DateTime
from app.models.base import Base, TimestampMixin


class ApprovalItem(Base, TimestampMixin):
    __tablename__ = "approval_items"

    user_id = Column(String, nullable=True, index=True)
    type = Column(String, nullable=False)       # email_send | social_post | lead_create | lead_update
    status = Column(String, default="pending")  # pending | approved | rejected | cancelled
    title = Column(String, nullable=False)
    description = Column(String)
    payload = Column(String, nullable=False)    # JSON blob
    reference_id = Column(String)
    reviewed_at = Column(DateTime)
    reviewer_note = Column(String)
