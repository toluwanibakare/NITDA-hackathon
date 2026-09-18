"""ThirdEye Python client — stdlib only (urllib), no required deps."""
from __future__ import annotations
import json
import os
import urllib.parse
import urllib.request
from typing import Any, Callable, Dict, List, Optional

from .evaluate import evaluate_local


class ThirdEyeBlockedError(Exception):
    def __init__(self, result: Dict[str, Any]):
        super().__init__(f"ThirdEye blocked request: {result.get('reason')} (risk {result.get('riskScore')})")
        self.result = result


def _resolve_base_url(explicit: Optional[str] = None) -> str:
    return (explicit or os.getenv("THIRDEYE_API_URL") or os.getenv("NEXT_PUBLIC_API_URL") or "http://localhost:4000").rstrip("/")


class ThirdEyeClient:
    def __init__(self, base_url: Optional[str] = None, api_key: Optional[str] = None,
                 timeout_s: float = 5.0, offline_profile: Optional[Dict[str, Any]] = None):
        self.base_url = _resolve_base_url(base_url)
        self.api_key = api_key or os.getenv("THIRDEYE_API_KEY")
        self.timeout_s = timeout_s
        self.offline_profile = offline_profile

    def _request(self, path: str, method: str = "GET", body: Optional[Dict[str, Any]] = None) -> Any:
        data = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(self.base_url + path, data=data, method=method)
        req.add_header("Content-Type", "application/json")
        if self.api_key:
            req.add_header("Authorization", f"Bearer {self.api_key}")
        try:
            with urllib.request.urlopen(req, timeout=self.timeout_s) as res:
                raw = res.read().decode()
                try:
                    return json.loads(raw) if raw else {}
                except json.JSONDecodeError:
                    return raw
        except Exception as e:
            raise RuntimeError(f"ThirdEye API {method} {path} failed: {e}") from e

    def health(self) -> Dict[str, Any]:
        return self._request("/healthz")

    def check_request(self, req: Dict[str, Any]) -> Dict[str, Any]:
        if not req.get("integrationId") or not req.get("endpoint") or not req.get("method"):
            raise ValueError("check_request requires integrationId, endpoint, method")
        try:
            return self._request("/api/check-request", "POST", req)
        except Exception:
            if self.offline_profile is not None:
                return evaluate_local(req, self.offline_profile)
            raise

    def check_or_block(self, req: Dict[str, Any]) -> Dict[str, Any]:
        result = self.check_request(req)
        if result.get("action") == "BLOCK":
            raise ThirdEyeBlockedError(result)
        return result

    def register_integration(self, integration: Dict[str, Any]) -> Dict[str, Any]:
        return self._request("/api/integrations", "POST", integration)

    def list_integrations(self) -> List[Dict[str, Any]]:
        return self._request("/api/integrations")

    def get_integration(self, integration_id: str) -> Dict[str, Any]:
        return self._request(f"/api/integrations/{urllib.parse.quote(integration_id)}")

    def quarantine(self, integration_id: str, reason: str = "Quarantined via SDK") -> Dict[str, Any]:
        return self._request(f"/api/integrations/{urllib.parse.quote(integration_id)}/quarantine", "POST", {"reason": reason})

    def release(self, integration_id: str) -> Dict[str, Any]:
        return self._request(f"/api/integrations/{urllib.parse.quote(integration_id)}/release", "POST", {})

    def security_events(self, integration_id: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        q = urllib.parse.urlencode({k: v for k, v in {"integrationId": integration_id, "limit": limit}.items() if v is not None})
        return self._request(f"/api/security-events?{q}")

    def dashboard_stats(self) -> Dict[str, Any]:
        return self._request("/api/dashboard/stats")

    def dashboard_activity(self, limit: int = 20) -> List[Dict[str, Any]]:
        return self._request(f"/api/dashboard/activity?limit={limit}")


def should_proceed(result: Dict[str, Any]) -> bool:
    return result.get("action") in ("ALLOW", "MONITOR", "RATE_LIMIT")
