"""Framework-agnostic guards: decorator + wrappers for outbound third-party calls."""
from __future__ import annotations
import functools
from typing import Any, Callable, Dict

from .client import ThirdEyeBlockedError, ThirdEyeClient


def guard(integration_id: str, endpoint: str, method: str = "POST", client: ThirdEyeClient | None = None):
    """Decorator: pre-flight ThirdEye check before the wrapped outbound call.

    Example:
        te = ThirdEyeClient()
        @guard("stripe_001", "/payments", client=te)
        def charge_stripe(order): ...
    """
    te = client or ThirdEyeClient()

    def deco(fn: Callable[..., Any]):
        @functools.wraps(fn)
        def wrapper(*args: Any, **kwargs: Any):
            data_requested = list(kwargs.pop("thirdeye_data", []) or [])
            result = te.check_or_block({
                "integrationId": integration_id, "method": method,
                "endpoint": endpoint, "dataRequested": data_requested,
                "requestCount": kwargs.pop("thirdeye_count", 0) or 0,
            })
            out = fn(*args, **kwargs)
            return {"result": result, "data": out}
        return wrapper
    return deco


def wrap_outbound(client: ThirdEyeClient, integration_id: str, endpoint: str, method: str = "POST"):
    """Wrap any callable with a ThirdEye pre-flight check."""
    def deco(fn: Callable[..., Any]):
        @functools.wraps(fn)
        def wrapper(*args: Any, data_requested: list | None = None, request_count: int = 0, **kwargs: Any):
            result = client.check_or_block({
                "integrationId": integration_id, "method": method, "endpoint": endpoint,
                "dataRequested": data_requested or [], "requestCount": request_count,
            })
            return {"result": result, "data": fn(*args, **kwargs)}
        return wrapper
    return deco
