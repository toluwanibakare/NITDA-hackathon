#!/usr/bin/env python3
"""Verify a running ThirdEye API. Stdlib only. Exit 0 = healthy."""
import argparse
import json
import sys
import urllib.request


def get(base, path, timeout=5):
    with urllib.request.urlopen(base + path, timeout=timeout) as r:
        return r.status, json.loads(r.read().decode() or "{}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base-url", default="http://localhost:4000")
    args = ap.parse_args()
    base = args.base_url.rstrip("/")
    failures = []

    def check(name, fn):
        try:
            fn()
            print(f"ok - {name}")
        except Exception as e:  # noqa: BLE001
            print(f"FAIL - {name}: {e}")
            failures.append(name)

    def t_health():
        s, b = get(base, "/healthz")
        assert s == 200 and b.get("ok") is True, b

    def t_manifest():
        s, b = get(base, "/api")
        assert s == 200 and "endpoints" in b, b

    def t_integrations():
        s, b = get(base, "/api/integrations")
        assert s == 200 and isinstance(b, list) and len(b) >= 4, f"expected >=4, got {b if isinstance(b, list) else b}"

    def t_check():
        data = json.dumps({"integrationId": "analytics_001", "method": "GET",
                           "endpoint": "/analytics/events", "dataRequested": ["event"],
                           "requestCount": 45}).encode()
        req = urllib.request.Request(base + "/api/check-request", data=data, method="POST",
                                     headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=5) as r:
            b = json.loads(r.read().decode())
        assert r.status == 200 and b.get("action") == "ALLOW", b

    check("healthz", t_health)
    check("manifest", t_manifest)
    check("integrations>=4", t_integrations)
    check("check-request ALLOW", t_check)

    if failures:
        print(f"\n{len(failures)} check(s) failed: {failures}", file=sys.stderr)
        return 1
    print("\nThirdEye setup healthy.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
