from sqlalchemy import Column, String, Integer, Float, UniqueConstraint
from app.models.base import Base, TimestampMixin


class UserUsage(Base, TimestampMixin):
    __tablename__ = "user_usage"
    __table_args__ = (UniqueConstraint("user_id", "month", name="uq_user_usage_month"),)

    user_id = Column(String, nullable=False, index=True)
    month = Column(String, nullable=False)          # "YYYY-MM"
    tokens_input = Column(Integer, default=0)
    tokens_output = Column(Integer, default=0)
    estimated_cost = Column(Float, default=0.0)     # USD
