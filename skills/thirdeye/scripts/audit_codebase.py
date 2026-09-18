#!/usr/bin/env python3
"""Audit a codebase for third-party HTTP integrations, outbound SDKs, and sensitive payload fields.
Designed for autonomous coding agents to discover integration surface and draft Trust Profiles.
Stdlib only.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from pathlib import Path
from urllib.parse import urlparse

# File extensions to scan
CODE_EXTENSIONS = {".ts", ".tsx", ".js", ".jsx", ".py", ".mjs", ".cjs"}

# Directories to ignore
IGNORE_DIRS = {
    "node_modules",
    ".git",
    ".next",
    "dist",
    "build",
    "__pycache__",
    ".venv",
    "venv",
    ".turbo",
    ".cache",
}

# Known 3rd-party vendor SDK patterns
VENDOR_PATTERNS = {
    "stripe": {"name": "Stripe Payments", "purpose": "Process checkout & subscriptions"},
    "sendgrid": {"name": "SendGrid Email", "purpose": "Transactional and marketing emails"},
    "resend": {"name": "Resend Email", "purpose": "Transactional email service"},
    "twilio": {"name": "Twilio SMS/Voice", "purpose": "SMS verification and phone notifications"},
    "openai": {"name": "OpenAI API", "purpose": "Generative AI and embeddings"},
    "anthropic": {"name": "Anthropic API", "purpose": "Claude AI model inferences"},
    "posthog": {"name": "PostHog Analytics", "purpose": "Product analytics and feature flags"},
    "mixpanel": {"name": "Mixpanel Analytics", "purpose": "User event tracking"},
    "datadog": {"name": "Datadog APM", "purpose": "Metrics and observability"},
    "sentry": {"name": "Sentry Error Monitoring", "purpose": "Application error tracking"},
    "supabase": {"name": "Supabase Database", "purpose": "Database & auth service"},
}

# Sensitive data keywords to detect in payloads
SENSITIVE_KEYWORDS = {
    "payment",
    "phone",
    "address",
    "password",
    "secret",
    "token",
    "ssn",
    "card",
    "cvv",
    "billing",
    "api_key",
}

# Regex for outbound HTTP calls
HTTP_CALL_REGEX = [
    # fetch("https://api.example.com/endpoint", { method: "POST" })
    re.compile(
        r"""fetch\s*\(\s*['"`](?P<url>https?://[^'"`\s]+|/[a-zA-Z0-9_\-\./]+)['"`](?:[^)]*method\s*:\s*['"`](?P<method>GET|POST|PUT|DELETE|PATCH)['"`])?""",
        re.IGNORECASE,
    ),
    # axios.get("https://..."), axios.post(...)
    re.compile(
        r"""axios\.(?P<method>get|post|put|delete|patch)\s*\(\s*['"`](?P<url>https?://[^'"`\s]+|/[a-zA-Z0-9_\-\./]+)['"`]""",
        re.IGNORECASE,
    ),
    # requests.get("https://..."), requests.post(...)
    re.compile(
        r"""requests\.(?P<method>get|post|put|delete|patch)\s*\(\s*['"`](?P<url>https?://[^'"`\s]+|/[a-zA-Z0-9_\-\./]+)['"`]""",
        re.IGNORECASE,
    ),
    # httpx.get("https://..."), httpx.post(...)
    re.compile(
        r"""httpx\.(?P<method>get|post|put|delete|patch)\s*\(\s*['"`](?P<url>https?://[^'"`\s]+|/[a-zA-Z0-9_\-\./]+)['"`]""",
        re.IGNORECASE,
    ),
]


def normalize_endpoint(raw_url: str) -> tuple[str, str]:
    """Returns (host_or_domain, path)."""
    if raw_url.startswith("http://") or raw_url.startswith("https://"):
        parsed = urlparse(raw_url)
        path = parsed.path or "/"
        return parsed.netloc, path
    clean = raw_url.split("?")[0]
    if not clean.startswith("/"):
        clean = "/" + clean
    return "relative_or_api", clean


def extract_data_keys(text: str) -> list[str]:
    """Find data payload keys around detected calls."""
    found = set()
    # Match JSON-like keys: "key": or key:
    matches = re.findall(r"""['"]?([a-zA-Z0-9_]{3,30})['"]?\s*:""", text)
    for m in matches:
        if m.lower() not in {"method", "headers", "content-type", "accept", "url", "body", "data"}:
            found.add(m)
    return sorted(found)


def scan_file(filepath: Path) -> dict:
    try:
        content = filepath.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return {}

    calls = []
    vendors_found = set()
    sensitive_found = set()

    # Scan vendors
    content_lower = content.lower()
    for vendor, meta in VENDOR_PATTERNS.items():
        if re.search(rf"""\b(import|require|from)\b.*['"]{vendor}""", content, re.IGNORECASE):
            vendors_found.add(vendor)

    # Scan sensitive data fields
    for kw in SENSITIVE_KEYWORDS:
        if re.search(rf"""\b{kw}\b""", content_lower):
            sensitive_found.add(kw)

    # Scan outbound HTTP calls
    for regex in HTTP_CALL_REGEX:
        for match in regex.finditer(content):
            gd = match.groupdict()
            url = gd.get("url", "")
            method = (gd.get("method") or "GET").upper()
            host, endpoint = normalize_endpoint(url)

            # Look at a snippet around the call for keys
            start = max(0, match.start() - 100)
            end = min(len(content), match.end() + 300)
            snippet = content[start:end]
            payload_keys = extract_data_keys(snippet)

            calls.append({
                "url": url,
                "host": host,
                "endpoint": endpoint,
                "method": method,
                "payload_keys": payload_keys,
            })

    return {
        "file": str(filepath),
        "calls": calls,
        "vendors": list(vendors_found),
        "sensitive": list(sensitive_found),
    }


def audit_directory(root_dir: str) -> dict:
    root = Path(root_dir).resolve()
    all_calls = []
    all_vendors = set()
    all_sensitive = set()
    grouped_by_target: dict[str, dict] = {}

    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in IGNORE_DIRS]
        for f in filenames:
            ext = os.path.splitext(f)[1]
            if ext in CODE_EXTENSIONS:
                fp = Path(dirpath) / f
                res = scan_file(fp)
                if not res:
                    continue
                if res["calls"]:
                    all_calls.extend(res["calls"])
                for v in res["vendors"]:
                    all_vendors.add(v)
                for s in res["sensitive"]:
                    all_sensitive.add(s)

    # Aggregate by host / integration domain
    for c in all_calls:
        target = c["host"]
        if target not in grouped_by_target:
            grouped_by_target[target] = {
                "endpoints": set(),
                "methods": set(),
                "observed_data": set(),
            }
        grouped_by_target[target]["endpoints"].add(c["endpoint"])
        grouped_by_target[target]["methods"].add(c["method"])
        for pk in c["payload_keys"]:
            grouped_by_target[target]["observed_data"].add(pk)

    # Convert sets to sorted lists for JSON serialization
    integrations_summary = []
    for target, data in sorted(grouped_by_target.items()):
        slug = re.sub(r"[^a-z0-9_]+", "_", target.lower()).strip("_") or "vendor_api"
        integrations_summary.append({
            "target": target,
            "suggested_id": f"{slug}_001",
            "allowedEndpoints": sorted(data["endpoints"]),
            "allowedMethods": sorted(data["methods"]),
            "observedData": sorted(data["observed_data"]),
            "recommendedForbiddenData": sorted(all_sensitive),
            "expectedRequestRate": 100,
        })

    # Add detected vendor SDKs if not already covered
    for v in sorted(all_vendors):
        meta = VENDOR_PATTERNS.get(v, {})
        if not any(v in item["suggested_id"] for item in integrations_summary):
            integrations_summary.append({
                "target": f"vendor-sdk:{v}",
                "suggested_id": f"{v}_001",
                "name": meta.get("name", v.capitalize()),
                "purpose": meta.get("purpose", f"Outbound integration with {v}"),
                "allowedEndpoints": [f"/{v}/v1/*"],
                "allowedMethods": ["GET", "POST"],
                "observedData": ["user_id", "event", "metadata"],
                "recommendedForbiddenData": sorted(all_sensitive),
                "expectedRequestRate": 100,
            })

    return {
        "audited_path": str(root),
        "total_calls_found": len(all_calls),
        "detected_vendors": sorted(all_vendors),
        "detected_sensitive_keywords": sorted(all_sensitive),
        "suggested_trust_profiles": integrations_summary,
    }


def main():
    ap = argparse.ArgumentParser(description="Audit codebase for third-party calls and sensitive parameters.")
    ap.add_argument("--path", default=".", help="Root directory of the project to audit")
    ap.add_argument("--output", help="Optional file path to write JSON output")
    ap.add_argument("--format", choices=["json", "summary"], default="summary", help="Output format")
    args = ap.parse_args()

    report = audit_directory(args.path)

    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2)
        print(f"Audit report saved to {args.output}")

    if args.format == "json":
        print(json.dumps(report, indent=2))
    else:
        print("=" * 60)
        print(f"ThirdEye Codebase Audit: {report['audited_path']}")
        print("=" * 60)
        print(f"Total Outbound HTTP Calls Detected: {report['total_calls_found']}")
        print(f"Detected 3rd-Party Vendor SDKs: {', '.join(report['detected_vendors']) or 'None'}")
        print(f"Sensitive Data Keywords Found: {', '.join(report['detected_sensitive_keywords']) or 'None'}")
        print("\nSuggested Trust Profiles:")
        for idx, item in enumerate(report["suggested_trust_profiles"], 1):
            print(f"\n  [{idx}] Integration ID: {item.get('suggested_id')}")
            print(f"      Target: {item.get('target')}")
            print(f"      Endpoints: {', '.join(item.get('allowedEndpoints', []))}")
            print(f"      Methods: {', '.join(item.get('allowedMethods', []))}")
            print(f"      Observed Data: {', '.join(item.get('observedData', [])[:8])}")
            print(f"      Forbidden Data: {', '.join(item.get('recommendedForbiddenData', [])[:6])}")
        print("\nAudit complete. Use `register_integration.py` to register these profiles.")


if __name__ == "__main__":
    main()
