"""Tiny in-memory sliding-window limiter (per process, per client IP).

Reasonable abuse protection for a demo; not a substitute for an edge/WAF
limiter when running multiple instances.
"""
import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request


class RateLimiter:
    def __init__(self, per_minute: int, trust_proxy: bool = False):
        self.per_minute = per_minute
        self.trust_proxy = trust_proxy
        self.hits = defaultdict(deque)

    def _key(self, request: Request) -> str:
        if self.trust_proxy:
            fwd = request.headers.get("x-forwarded-for")
            if fwd:
                return fwd.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    def check(self, request: Request, cost: int = 1) -> None:
        if self.per_minute <= 0:
            return
        now = time.monotonic()
        q = self.hits[self._key(request)]
        while q and now - q[0] > 60:
            q.popleft()
        if len(q) + cost > self.per_minute:
            raise HTTPException(429, "Too many requests. Please wait a moment and try again.")
        q.extend([now] * cost)
        if len(self.hits) > 5000:  # bound memory
            for k in [k for k, v in self.hits.items() if not v][:1000]:
                self.hits.pop(k, None)
