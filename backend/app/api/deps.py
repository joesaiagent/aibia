import time
import httpx
import jwt as pyjwt
from fastapi import Header, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db

# JWKS cache: {issuer: (keys_dict, fetched_at_timestamp)}
_jwks_cache: dict = {}
_JWKS_TTL = 3600  # refresh keys every hour


def _get_jwks(issuer: str) -> dict:
    now = time.time()
    cached = _jwks_cache.get(issuer)
    if cached and (now - cached[1]) < _JWKS_TTL:
        return cached[0]
    try:
        res = httpx.get(f"{issuer}/.well-known/jwks.json", timeout=5)
        res.raise_for_status()
        keys = res.json()
        _jwks_cache[issuer] = (keys, now)
        return keys
    except Exception:
        raise HTTPException(status_code=503, detail="Auth service unavailable")


def get_user_id(authorization: Optional[str] = Header(None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization[7:]
    try:
        # Decode without verifying to extract issuer for JWKS lookup
        unverified = pyjwt.decode(token, options={"verify_signature": False})
        issuer = unverified.get("iss", "")
        if not issuer or not issuer.startswith("https://"):
            raise HTTPException(status_code=401, detail="Invalid token")

        # Fetch JWKS and find the matching key by kid
        jwks = _get_jwks(issuer)
        kid = pyjwt.get_unverified_header(token).get("kid")

        for key_data in jwks.get("keys", []):
            if key_data.get("kid") == kid:
                public_key = pyjwt.algorithms.RSAAlgorithm.from_jwk(key_data)
                payload = pyjwt.decode(
                    token,
                    public_key,
                    algorithms=["RS256"],
                    options={"verify_aud": False},
                )
                user_id = payload.get("sub", "")
                if not user_id:
                    raise HTTPException(status_code=401, detail="Invalid token")
                return user_id

        raise HTTPException(status_code=401, detail="Invalid token")
    except HTTPException:
        raise
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


def require_subscription(user_id: str = Depends(get_user_id), db: Session = Depends(get_db)) -> str:
    from app.models.user_subscription import UserSubscription
    sub = db.query(UserSubscription).filter(UserSubscription.user_id == user_id).first()
    if not sub or sub.status not in ("active", "trialing"):
        raise HTTPException(status_code=402, detail="Active subscription required")
    return user_id
