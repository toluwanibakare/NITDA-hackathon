# ThirdEye API Payload & Contract Specification

This document serves as the complete reference for frontend developers integrating with the ThirdEye backend service.

---

## 1. General Standards

* **Base URL**: `http://localhost:4000`
* **Default Content-Type**: `application/json`
* **Dual Casing Guarantee**: All response objects provide attributes in both `camelCase` and `snake_case` (e.g., `risk_score` and `riskScore`) to guarantee zero `undefined` reference bugs across JavaScript/TypeScript components.

---

## 2. Enums & Core Types

### RiskLevel
```typescript
type RiskLevel = 'TRUSTED' | 'SUSPICIOUS' | 'HIGH_RISK' | 'CRITICAL';
```
* `0 - 30`: `TRUSTED`
* `31 - 60`: `SUSPICIOUS`
* `61 - 80`: `HIGH_RISK`
* `81 - 100`: `CRITICAL`

### Action
```typescript
type Action = 'ALLOW' | 'MONITOR' | 'RATE_LIMIT' | 'BLOCK' | 'QUARANTINE';
```

### IntegrationStatus
```typescript
type IntegrationStatus = 'ACTIVE' | 'MONITORED' | 'RATE_LIMITED' | 'QUARANTINED';
```

### ContextEvent
```typescript
type ContextEvent = 'none' | 'black_friday' | 'campaign_launch' | 'known_spike';
```

---

## 3. Endpoints Reference

### 3.1 Request Evaluation (Core Engine)

#### `POST /api/check-request`
Evaluates an outbound third-party request against its registered trust profile.

* **Used By**: `/simulator`, `/settings` (Prove sales-day safety button), and runtime proxy middleware.
* **Request Headers**: `Content-Type: application/json`
* **Request Body**:
  ```json
  {
    "integrationId": "analytics_001",
    "method": "GET",
    "endpoint": "/customers/payment-details",
    "dataRequested": ["payment", "phone", "address"],
    "requestCount": 800,
    "timestamp": "2026-09-13T12:00:00.000Z",
    "contextEvent": "none"
  }
  ```
* **Success Response (`200 OK`)**:
  ```json
  {
    "riskScore": 75,
    "level": "HIGH_RISK",
    "violations": [
      {
        "code": "UNKNOWN_ENDPOINT",
        "detail": "/customers/payment-details outside allowed scope",
        "points": 20
      },
      {
        "code": "PURPOSE_MISMATCH",
        "detail": "Analytics Provider registered purpose does not match /customers/payment-details",
        "points": 25
      },
      {
        "code": "FORBIDDEN_DATA",
        "detail": "Attempted access to restricted data attributes: payment, phone, address",
        "points": 30
      }
    ],
    "action": "RATE_LIMIT",
    "reason": "/customers/payment-details outside allowed scope; Analytics Provider registered purpose does not match; Attempted access to restricted data attributes: payment, phone, address"
  }
  ```
* **Error Response (`400 Bad Request`)**:
  ```json
  {
    "error": "Missing required attributes: integrationId, endpoint, and method are mandatory.",
    "code": "INVALID_REQUEST"
  }
  ```

---

### 3.2 Integrations Registry

#### `GET /api/integrations`
Lists all registered integrations with trust scores and rate quotas.

* **Used By**: `/integrations` (Registry Table), Navigation dropdowns.
* **Query Parameters**: None
* **Success Response (`200 OK`)**:
  ```json
  [
    {
      "id": "analytics_001",
      "name": "Analytics Provider",
      "purpose": "Collect anonymous usage statistics",
      "status": "ACTIVE",
      "risk_score": 8,
      "riskScore": 8,
      "expected_request_rate": 100,
      "expectedRequestRate": 100,
      "allowed_endpoints": ["/analytics/events", "/analytics/metrics"],
      "allowedEndpoints": ["/analytics/events", "/analytics/metrics"],
      "allowed_methods": ["GET", "POST"],
      "allowedMethods": ["GET", "POST"],
      "allowed_data": ["anonymous_user_id", "page", "event", "timestamp"],
      "allowedData": ["anonymous_user_id", "page", "event", "timestamp"],
      "forbidden_data": ["payment", "phone", "address", "password", "customer"],
      "forbiddenData": ["payment", "phone", "address", "password", "customer"],
      "requestsPerMin": 100,
      "lastActivity": "2026-09-13T12:00:00.000Z",
      "created_at": "2026-09-13T10:00:00.000Z",
      "createdAt": "2026-09-13T10:00:00.000Z"
    }
  ]
  ```

---

#### `GET /api/integrations/:id`
Retrieves a single integration profile along with real-time behavior metrics and violation history.

* **Used By**: `/integrations/[id]` (Trust Profile Detail page).
* **URL Parameters**: `:id` (e.g. `analytics_001`, `payment_001`, `delivery_001`, `marketing_001`)
* **Success Response (`200 OK`)**:
  ```json
  {
    "profile": {
      "id": "analytics_001",
      "name": "Analytics Provider",
      "purpose": "Collect anonymous usage statistics",
      "status": "ACTIVE",
      "risk_score": 8,
      "riskScore": 8,
      "expected_request_rate": 100,
      "expectedRequestRate": 100,
      "allowed_endpoints": ["/analytics/events", "/analytics/metrics"],
      "allowedEndpoints": ["/analytics/events", "/analytics/metrics"],
      "allowed_methods": ["GET", "POST"],
      "allowedMethods": ["GET", "POST"],
      "allowed_data": ["anonymous_user_id", "page", "event", "timestamp"],
      "allowedData": ["anonymous_user_id", "page", "event", "timestamp"],
      "forbidden_data": ["payment", "phone", "address", "password", "customer"],
      "forbiddenData": ["payment", "phone", "address", "password", "customer"],
      "created_at": "2026-09-13T10:00:00.000Z",
      "createdAt": "2026-09-13T10:00:00.000Z"
    },
    "behaviour": {
      "currentRatePerMin": 100,
      "expectedRatePerMin": 100,
      "deviationMultiple": 1.0,
      "anomalous": false
    },
    "recentViolations": []
  }
  ```

---

#### `POST /api/integrations`
Registers a new integration with default active status.

* **Request Body**:
  ```json
  {
    "id": "crm_001",
    "name": "CRM Sync",
    "purpose": "Synchronize lead interactions",
    "expectedRequestRate": 150,
    "allowedEndpoints": ["/leads", "/contacts"],
    "allowedMethods": ["GET", "POST"],
    "allowedData": ["lead_id", "email", "name"],
    "forbiddenData": ["credit_card", "password"]
  }
  ```
* **Success Response (`201 Created`)**:
  ```json
  {
    "id": "crm_001",
    "name": "CRM Sync",
    "purpose": "Synchronize lead interactions",
    "status": "ACTIVE",
    "riskScore": 0,
    "expectedRequestRate": 150,
    "allowedEndpoints": ["/leads", "/contacts"],
    "allowedMethods": ["GET", "POST"],
    "allowedData": ["lead_id", "email", "name"],
    "forbiddenData": ["credit_card", "password"],
    "createdAt": "2026-09-13T12:00:00.000Z"
  }
  ```

---

#### `PATCH /api/integrations/:id`
Updates baseline quotas or declared purpose.

* **Request Body**:
  ```json
  {
    "expectedRequestRate": 180,
    "purpose": "Updated operational purpose"
  }
  ```
* **Success Response (`200 OK`)**:
  ```json
  {
    "id": "analytics_001",
    "expectedRequestRate": 180,
    "purpose": "Updated operational purpose",
    "status": "ACTIVE",
    "updatedAt": "2026-09-13T12:00:00.000Z"
  }
  ```

---

#### `POST /api/integrations/:id/quarantine`
Locks an integration into quarantine mode, instantly setting risk to 95 and blocking outbound requests.

* **Used By**: `/integrations/[id]` ("Quarantine" button).
* **Request Body**:
  ```json
  {
    "reason": "Manual quarantine applied by security operator"
  }
  ```
* **Success Response (`200 OK`)**:
  ```json
  {
    "id": "analytics_001",
    "status": "QUARANTINED",
    "riskScore": 95,
    "quarantinedAt": "2026-09-13T12:00:00.000Z",
    "reason": "Manual quarantine applied by security operator"
  }
  ```

---

#### `POST /api/integrations/:id/release`
Restores an integration from quarantine back to active monitoring and resets risk to 8.

* **Used By**: `/integrations/[id]` ("Release" button), `/simulator` (Reset button).
* **Request Body**: `{}`
* **Success Response (`200 OK`)**:
  ```json
  {
    "id": "analytics_001",
    "status": "ACTIVE",
    "riskScore": 8,
    "releasedAt": "2026-09-13T12:00:00.000Z",
    "message": "Integration released and restored to active state"
  }
  ```

---

### 3.3 Security Events Audit

#### `GET /api/security-events`
Returns tamper-evident security audit logs with filtering support.

* **Used By**: `/events` (Audit Trail), `/integrations/[id]` (Recent Violations feed).
* **Query Parameters**:
  * `limit` (number, default: 50, max: 100)
  * `integrationId` (string, optional: e.g. `analytics_001`)
* **Success Response (`200 OK`)**:
  ```json
  [
    {
      "id": "e4b6c891-20d4-4a2a-b6b5-903df19e71ab",
      "integration_id": "analytics_001",
      "integrationId": "analytics_001",
      "endpoint": "/customers/payment-details",
      "event_type": "FORBIDDEN_DATA",
      "eventType": "FORBIDDEN_DATA",
      "risk_score": 95,
      "riskScore": 95,
      "action": "BLOCK",
      "reason": "Analytics integration attempted to access payment information",
      "created_at": "2026-09-13T11:55:00.000Z",
      "createdAt": "2026-09-13T11:55:00.000Z"
    }
  ]
  ```

---

### 3.4 Dashboard & Analytics

#### `GET /api/dashboard/stats`
Provides high-level KPI cards for the executive dashboard overview.

* **Used By**: `/dashboard` (Top Stat Cards).
* **Success Response (`200 OK`)**:
  ```json
  {
    "totalIntegrations": 4,
    "activeIntegrations": 4,
    "quarantinedIntegrations": 0,
    "averageRiskScore": 12,
    "totalRequestsToday": 1420,
    "totalViolationsToday": 2
  }
  ```

#### `GET /api/dashboard/activity`
Provides chronological live system events for the activity feed.

* **Used By**: `/dashboard` (Activity Timeline).
* **Success Response (`200 OK`)**:
  ```json
  {
    "activities": [
      {
        "id": "act_001",
        "timestamp": "2026-09-13T12:00:00.000Z",
        "integrationId": "analytics_001",
        "title": "Anomaly Flagged",
        "description": "Endpoint /customers/profile invoked outside purpose scope",
        "severity": "medium"
      }
    ]
  }
  ```

---

### 3.5 Attack Simulator Control

#### `POST /api/simulator/start`
Notifies backend that an attack simulation run has begun.

* **Used By**: `/simulator` ("Start attack" button).
* **Request Body**:
  ```json
  {
    "integrationId": "analytics_001",
    "attack": "credential_compromise"
  }
  ```
* **Success Response (`200 OK`)**:
  ```json
  {
    "sessionId": "sim_1726230000000",
    "status": "started",
    "target": "analytics_001",
    "phases": [
      {
        "phase": 1,
        "name": "Normal Operation",
        "endpoint": "/analytics/events",
        "method": "GET",
        "dataRequested": ["event", "timestamp"],
        "requestCount": 95,
        "expectedRisk": 5,
        "expectedAction": "ALLOW"
      },
      {
        "phase": 2,
        "name": "Endpoint Probe (Reconnaissance)",
        "endpoint": "/customers/profile",
        "method": "GET",
        "dataRequested": ["anonymous_user_id"],
        "requestCount": 300,
        "expectedRisk": 45,
        "expectedAction": "MONITOR"
      },
      {
        "phase": 3,
        "name": "Sensitive Data Exfiltration Surge",
        "endpoint": "/customers/payment-details",
        "method": "GET",
        "dataRequested": ["payment", "phone"],
        "requestCount": 800,
        "expectedRisk": 75,
        "expectedAction": "RATE_LIMIT"
      },
      {
        "phase": 4,
        "name": "Full Breach Spike & Auto-Quarantine",
        "endpoint": "/customers/payment-details",
        "method": "GET",
        "dataRequested": ["payment", "phone", "address"],
        "requestCount": 1780,
        "expectedRisk": 95,
        "expectedAction": "BLOCK"
      }
    ]
  }
  ```

#### `POST /api/simulator/stop`
Halts any active simulator loop.

* **Request Body**: `{}`
* **Success Response (`200 OK`)**:
  ```json
  {
    "status": "stopped",
    "message": "Simulation halted"
  }
  ```

#### `POST /api/simulator/reset`
Resets target integration back to active state and clears demo telemetry.

* **Request Body**:
  ```json
  {
    "integrationId": "analytics_001"
  }
  ```
* **Success Response (`200 OK`)**:
  ```json
  {
    "status": "reset",
    "integrationId": "analytics_001",
    "riskScore": 8,
    "integrationStatus": "ACTIVE"
  }
  ```

---

## 4. Frontend Route to API Call Mapping

| Page Route | User Action | HTTP Method & Path | Primary Expected Output |
| :--- | :--- | :--- | :--- |
| `/dashboard` | Page Mount | `GET /api/dashboard/stats` | `{ totalIntegrations, activeIntegrations, ... }` |
| `/dashboard` | Page Mount | `GET /api/dashboard/activity` | `{ activities: [...] }` |
| `/integrations` | Page Mount | `GET /api/integrations` | Array of `IntegrationRow` |
| `/integrations/[id]` | Page Mount | `GET /api/integrations/:id` | `{ profile, behaviour, recentViolations }` |
| `/integrations/[id]` | Page Mount | `GET /api/security-events?integrationId=:id` | Array of `SecEvent` |
| `/integrations/[id]` | Click Quarantine | `POST /api/integrations/:id/quarantine` | `{ status: "QUARANTINED", riskScore: 95 }` |
| `/integrations/[id]` | Click Release | `POST /api/integrations/:id/release` | `{ status: "ACTIVE", riskScore: 8 }` |
| `/simulator` | Click Start | `POST /api/simulator/start` | `{ sessionId, status: "started" }` |
| `/simulator` | Phase 1..4 Loop | `POST /api/check-request` | `{ riskScore, level, action, violations }` |
| `/simulator` | Click Stop | `POST /api/simulator/stop` | `{ status: "stopped" }` |
| `/simulator` | Click Reset | `POST /api/integrations/:id/release` | `{ status: "ACTIVE", riskScore: 8 }` |
| `/events` | Filter by Tab | `GET /api/security-events?limit=50` | Array of `SecEvent` (supports filtering) |
| `/settings` | Prove Sales Day | `POST /api/check-request` (with `contextEvent`) | `{ riskScore: 0, action: "ALLOW" }` |
