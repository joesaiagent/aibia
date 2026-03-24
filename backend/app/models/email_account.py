from sqlalchemy import Column, String, DateTime, Boolean
from app.models.base import Base, TimestampMixin


class EmailAccount(Base, TimestampMixin):
    __tablename__ = "email_accounts"

    user_id = Column(String, nullable=True, index=True)
    provider = Column(String, nullable=False)       # gmail | outlook
    email_address = Column(String, nullable=False, unique=True)
    display_name = Column(String)
    access_token = Column(String, nullable=False)   # encrypted
    refresh_token = Column(String, nullable=False)  # encrypted
    token_expiry = Column(DateTime)
    scopes = Column(String)                         # JSON array
    is_active = Column(Boolean, default=True)
