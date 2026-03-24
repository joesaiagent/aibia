from fastapi import Header, HTTPException
from typing import Optional


def get_user_id(x_user_id: Optional[str] = Header(None)) -> str:
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return x_user_id
