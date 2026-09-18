"""Local risk evaluation — mirrors apps/api/src/lib/riskEngine.ts."""
from __future__ import annotations
from datetime import datetime
from typing import Any, Dict, List, Optional


def level_for_score(score: int) -> str:
    if score >= 81:
        return "CRITICAL"
    if score >= 61:
        return "HIGH_RISK"
    if score >= 31:
        return "SUSPICIOUS"
    return "TRUSTED"


def action_for_level(level: str) -> str:
    return {
        "TRUSTED": "ALLOW",
        "SUSPICIOUS": "MONITOR",
        "HIGH_RISK": "RATE_LIMIT",
        "CRITICAL": "BLOCK",
    }[level]


def evaluate_local(req: Dict[str, Any], profile: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    violations: List[Dict[str, Any]] = []
    score = 0
    requested = [(d or "").lower() for d in (req.get("dataRequested") or req.get("data_requested") or [])]

    if not profile:
        return {
            "riskScore": 50, "level": "SUSPICIOUS", "action": "BLOCK",
            "violations": [{"code": "UNKNOWN_INTEGRATION", "detail": f"Unregistered integration: {req.get('integrationId')}", "points": 50}],
            "reason": f"Unregistered integration {req.get('integrationId')} blocked",
        }

    allowed_endpoints = [e.lower() for e in profile.get("allowedEndpoints", profile.get("allowed_endpoints", []))]
    allowed_methods = [m.upper() for m in profile.get("allowedMethods", profile.get("allowed_methods", ["GET", "POST"]))]
    forbidden = [d.lower() for d in profile.get("forbiddenData", profile.get("forbidden_data", []))]
    endpoint = str(req.get("endpoint", ""))
    method = str(req.get("method", "")).upper()
    name = profile.get("name", profile.get("id", "integration"))
    expected = int(profile.get("expectedRequestRate", profile.get("expected_request_rate", 100)) or 100)

    if endpoint.lower() not in allowed_endpoints:
        score += 20
        violations.append({"code": "UNKNOWN_ENDPOINT", "detail": f"{endpoint} outside allowed scope", "points": 20})
        score += 25
        violations.append({"code": "PURPOSE_MISMATCH", "detail": f'{name} purpose "{profile.get("purpose")}" does not match {endpoint}', "points": 25})

    if method not in allowed_methods:
        score += 10
        violations.append({"code": "UNKNOWN_METHOD", "detail": f"Method {method} not permitted", "points": 10})

    matched = [d for d in requested if any(d in f or f in d for f in forbidden)]
    if matched:
        score += 30
        violations.append({"code": "FORBIDDEN_DATA", "detail": f"Restricted data: {', '.join(matched)}", "points": 30})

    count = int(req.get("requestCount", req.get("request_count", 0)) or 0)
    if count > expected * 10:
        score += 20
        violations.append({"code": "ABNORMAL_VOLUME", "detail": f"Critical spike: {count}/min vs baseline {expected}/min", "points": 20})
    elif count > expected * 3 and not matched:
        score += 20
        violations.append({"code": "ABNORMAL_VOLUME", "detail": f"Spike: {count}/min vs baseline {expected}/min", "points": 20})

    ts = req.get("timestamp")
    if ts:
        try:
            h = datetime.fromisoformat(str(ts).replace("Z", "+00:00")).hour
            if 0 <= h < 5:
                score += 5
                violations.append({"code": "UNUSUAL_TIME", "detail": f"Off-hours activity at {h}:00", "points": 5})
        except Exception:
            pass

    if req.get("contextEvent", req.get("context_event", "none")) not in (None, "none"):
        score = max(0, score - 20)

    score = min(100, max(0, score))
    level = level_for_score(score)
    return {
        "riskScore": score, "level": level,
        "violations": violations, "action": action_for_level(level),
        "reason": "; ".join(v["detail"] for v in violations) if violations else f"Conforms to {name} trust profile",
    }
