from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, JSON
from app.models.base import Base


class ChatConversation(Base):
    __tablename__ = "chat_conversations"

    id = Column(String, primary_key=True)           # conversation_id
    user_id = Column(String, nullable=False, index=True)
    messages = Column(JSON, default=list)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
