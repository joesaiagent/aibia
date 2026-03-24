from fastapi import Header, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db


def get_user_id(x_user_id: Optional[str] = Header(None)) -> str:
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return x_user_id


def require_subscription(user_id: str = Depends(get_user_id), db: Session = Depends(get_db)) -> str:
    from app.models.user_subscription import UserSubscription
    sub = db.query(UserSubscription).filter(UserSubscription.user_id == user_id).first()
    if not sub or sub.status not in ("active", "trialing"):
        raise HTTPException(status_code=402, detail="Active subscription required")
    return user_id
