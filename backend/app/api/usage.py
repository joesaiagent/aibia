from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.user_usage import UserUsage

# Claude Opus 4.6 pricing (per million tokens)
COST_PER_M_INPUT = 15.0
COST_PER_M_OUTPUT = 75.0

# Monthly cap per user in USD
MONTHLY_CAP = 30.0

SUPPORT_MESSAGE = (
    "You've reached your monthly usage limit. "
    "Please contact Customer Service for immediate assistance: "
    "call (732) 710-9918 or email info@aibia.io"
)


def _current_month() -> str:
    return datetime.utcnow().strftime("%Y-%m")


def check_usage_cap(user_id: str, db: Session):
    """Raise 402 if the user has hit their monthly cap."""
    month = _current_month()
    record = db.query(UserUsage).filter(
        UserUsage.user_id == user_id,
        UserUsage.month == month,
    ).first()
    if record and record.estimated_cost >= MONTHLY_CAP:
        raise HTTPException(status_code=402, detail=SUPPORT_MESSAGE)


def record_usage(user_id: str, tokens_input: int, tokens_output: int, db: Session):
    """Add token usage and update estimated cost for the current month."""
    month = _current_month()
    cost = (tokens_input / 1_000_000 * COST_PER_M_INPUT) + \
           (tokens_output / 1_000_000 * COST_PER_M_OUTPUT)

    record = db.query(UserUsage).filter(
        UserUsage.user_id == user_id,
        UserUsage.month == month,
    ).first()

    if record:
        record.tokens_input += tokens_input
        record.tokens_output += tokens_output
        record.estimated_cost += cost
    else:
        record = UserUsage(
            user_id=user_id,
            month=month,
            tokens_input=tokens_input,
            tokens_output=tokens_output,
            estimated_cost=cost,
        )
        db.add(record)
    db.commit()
