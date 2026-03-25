import time
from collections import defaultdict, deque
from fastapi import HTTPException, Depends
from app.api.deps import get_user_id


class RateLimiter:
    """Sliding window rate limiter — no Redis needed, resets on restart."""

    def __init__(self):
        # {key: deque of timestamps}
        self._windows: dict[str, deque] = defaultdict(deque)

    def check(self, key: str, limit: int, window_seconds: int):
        now = time.time()
        q = self._windows[key]

        # Drop timestamps outside the window
        while q and now - q[0] > window_seconds:
            q.popleft()

        if len(q) >= limit:
            retry_after = int(window_seconds - (now - q[0])) + 1
            raise HTTPException(
                status_code=429,
                detail=f"Too many requests. Please wait {retry_after} seconds.",
                headers={"Retry-After": str(retry_after)},
            )

        q.append(now)


_limiter = RateLimiter()


def chat_limit(user_id: str = Depends(get_user_id)) -> str:
    """30 chat messages per minute per user."""
    _limiter.check(f"chat:{user_id}", limit=30, window_seconds=60)
    return user_id


def agent_limit(user_id: str = Depends(get_user_id)) -> str:
    """10 agent tasks per minute per user — each task is expensive."""
    _limiter.check(f"agent:{user_id}", limit=10, window_seconds=60)
    return user_id


def api_limit(user_id: str = Depends(get_user_id)) -> str:
    """60 requests per minute per user for general endpoints."""
    _limiter.check(f"api:{user_id}", limit=60, window_seconds=60)
    return user_id
