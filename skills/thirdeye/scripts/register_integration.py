#!/usr/bin/env python3
"""Register a Trust Profile from a JSON file. Stdlib only.

Usage: python3 register_integration.py --file profile.json [--base-url URL]
"""
import argparse
import json
import urllib.request


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--file", required=True)
    ap.add_argument("--base-url", default="http://localhost:4000")
    args = ap.parse_args()
    with open(args.file) as f:
        body = json.load(f)
    for k in ("id", "name", "purpose"):
        if not body.get(k):
            raise SystemExit(f"profile missing required field: {k}")
    data = json.dumps(body).encode()
    req = urllib.request.Request(args.base_url.rstrip("/") + "/api/integrations",
                                 data=data, method="POST",
                                 headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=10) as r:
        out = json.loads(r.read().decode())
        print(f"status={r.status} id={out.get('id')} risk={out.get('riskScore')}")
        print(json.dumps(out, indent=2))


if __name__ == "__main__":
    main()
