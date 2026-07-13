import asyncio
from dataclasses import dataclass
from time import monotonic

from fastapi import HTTPException, status


@dataclass
class _Window:
    started_at: float
    count: int


class FixedWindowRateLimiter:
    """Small per-process limiter for costly outbound operations.

    ponytail: counters live in this process, so N workers allow N x limit. Move the
    window to a shared store when the API runs more than one worker.
    """

    def __init__(self, limit: int, window_seconds: int) -> None:
        self.limit = limit
        self.window_seconds = window_seconds
        self._windows: dict[str, _Window] = {}
        self._lock = asyncio.Lock()

    async def check(self, key: str) -> None:
        now = monotonic()
        async with self._lock:
            if len(self._windows) > 1000:
                self._windows = {
                    item_key: item
                    for item_key, item in self._windows.items()
                    if now - item.started_at < self.window_seconds
                }
            window = self._windows.get(key)
            if window is None or now - window.started_at >= self.window_seconds:
                self._windows[key] = _Window(started_at=now, count=1)
                return
            if window.count >= self.limit:
                retry_after = max(1, int(self.window_seconds - (now - window.started_at)))
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many external operations. Try again shortly.",
                    headers={"Retry-After": str(retry_after)},
                )
            window.count += 1

    async def reset(self) -> None:
        """Clear state for test isolation."""
        async with self._lock:
            self._windows.clear()


external_operation_limiter = FixedWindowRateLimiter(limit=10, window_seconds=60)
