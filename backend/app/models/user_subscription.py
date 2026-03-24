from sqlalchemy import Column, String
from app.models.base import Base, TimestampMixin


class UserSubscription(Base, TimestampMixin):
    __tablename__ = "user_subscriptions"

    user_id = Column(String, nullable=False, unique=True, index=True)
    stripe_customer_id = Column(String)
    stripe_subscription_id = Column(String, index=True)
    status = Column(String, default="inactive")  # active | trialing | past_due | inactive | canceled
    plan = Column(String, default="solo")
