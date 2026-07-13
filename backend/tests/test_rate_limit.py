import pytest
from fastapi import HTTPException

from app.core.rate_limit import FixedWindowRateLimiter


async def test_rate_limiter_rejects_requests_over_limit():
    limiter = FixedWindowRateLimiter(limit=2, window_seconds=60)

    await limiter.check("user")
    await limiter.check("user")

    with pytest.raises(HTTPException) as exc_info:
        await limiter.check("user")

    assert exc_info.value.status_code == 429
    assert exc_info.value.headers["Retry-After"]
