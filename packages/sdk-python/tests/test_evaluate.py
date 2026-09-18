from thirdeye.evaluate import evaluate_local

PROFILE = {
    "id": "analytics_001",
    "name": "Analytics Provider",
    "purpose": "Collect anonymous usage statistics",
    "allowedEndpoints": ["/analytics/events", "/analytics/metrics"],
    "allowedMethods": ["GET", "POST"],
    "allowedData": ["anonymous_user_id", "page", "event", "timestamp"],
    "forbiddenData": ["payment", "phone", "address", "password"],
    "expectedRequestRate": 100,
}


def test_normal_allow():
    r = evaluate_local({"integrationId": "analytics_001", "method": "GET",
                        "endpoint": "/analytics/events", "dataRequested": ["event"], "requestCount": 45}, PROFILE)
    assert r["action"] == "ALLOW" and r["riskScore"] <= 30


def test_probe_monitor_45():
    r = evaluate_local({"integrationId": "analytics_001", "method": "GET",
                        "endpoint": "/customers/profile", "dataRequested": ["event"], "requestCount": 100}, PROFILE)
    assert r["riskScore"] == 45 and r["action"] == "MONITOR"


def test_exfiltration_block_95():
    r = evaluate_local({"integrationId": "analytics_001", "method": "GET",
                        "endpoint": "/customers/payment-details",
                        "dataRequested": ["payment", "phone", "address"], "requestCount": 1780}, PROFILE)
    assert r["riskScore"] == 95 and r["action"] == "BLOCK"
