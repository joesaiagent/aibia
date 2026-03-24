from sqlalchemy import Column, String, DateTime, Boolean, UniqueConstraint
from app.models.base import Base, TimestampMixin


class EmailAccount(Base, TimestampMixin):
    __tablename__ = "email_accounts"
    __table_args__ = (UniqueConstraint("email_address", "user_id", name="uq_email_account_user"),)

    user_id = Column(String, nullable=True, index=True)
    provider = Column(String, nullable=False)       # gmail | outlook
    email_address = Column(String, nullable=False)
    display_name = Column(String)
    access_token = Column(String, nullable=False)   # encrypted
    refresh_token = Column(String, nullable=False)  # encrypted
    token_expiry = Column(DateTime)
    scopes = Column(String)                         # JSON array
    is_active = Column(Boolean, default=True)
