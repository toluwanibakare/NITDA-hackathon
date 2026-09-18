# THIRDEYE — BUILD-READY PRD

**Project:** ICSC Conference 2nd Edition — G1
**Product:** ThirdEye
**Type:** Third-Party Integration Security Middleware (ThirdEye watches your third parties)
**Goal:** Build a working security middleware that detects when an authorized third-party integration starts behaving outside its intended purpose.

---

# 1. THE PRODUCT

ThirdEye sits between an application and its third-party integrations.

```text
APPLICATION
     ↓
THIRDEYE MIDDLEWARE
     ↓
RISK ENGINE
     ↓
THIRD-PARTY API
```

Every request is evaluated before it reaches the external service.

ThirdEye answers:

> **“Is this integration allowed to make this request, and does this request make sense for what the integration is supposed to do?”**

---

# 2. MVP — BUILD ONLY THESE

Build these **7 modules**:

1. Integration Registry
2. Trust Profile
3. Request Interceptor
4. Risk Engine
5. Response Engine
6. Security Event Log
7. Live Security Dashboard

Do NOT build a full enterprise API gateway.

---

# 3. DEMO INTEGRATIONS

Create 4 simulated integrations.

### Payment Provider

Purpose:

- Process payments

Allowed:

- `/payments`
- `/payments/status`

Allowed data:

- order ID
- amount
- transaction ID

Forbidden:

- passwords
- customer profile
- marketing data

---

### Delivery Provider

Purpose:

- Deliver customer orders

Allowed:

- `/orders`
- `/delivery`
- `/delivery/status`

Allowed data:

- order ID
- delivery address
- customer name
- phone

Forbidden:

- payment information
- passwords
- marketing records

---

### Analytics Provider

Purpose:

- Collect anonymous usage statistics

Allowed:

- `/analytics/events`
- `/analytics/metrics`

Allowed data:

- anonymous user ID
- page
- event
- timestamp

Forbidden:

- payment data
- phone numbers
- addresses
- passwords
- customer profiles

---

### Marketing Provider

Purpose:

- Manage marketing campaigns

Allowed:

- `/campaigns`
- `/campaigns/events`

Allowed data:

- campaign ID
- anonymous user ID
- event

Forbidden:

- payment data
- passwords

---

# 4. INTEGRATION PROFILE

Each integration must have:

```json
{
  "id": "analytics_001",
  "name": "Analytics Provider",
  "purpose": "Collect anonymous usage statistics",
  "allowedEndpoints": ["/analytics/events", "/analytics/metrics"],
  "allowedMethods": ["GET", "POST"],
  "allowedData": ["anonymous_user_id", "page", "event", "timestamp"],
  "forbiddenData": ["payment", "phone", "address", "password"],
  "expectedRequestRate": 100
}
```

This is the integration's **Trust Profile**.

---

# 5. REQUEST MODEL

Every request entering the middleware should look like:

```json
{
  "integrationId": "analytics_001",
  "method": "GET",
  "endpoint": "/customers/payment-details",
  "dataRequested": ["payment", "phone", "address"],
  "requestCount": 1780,
  "timestamp": "2026-09-11T14:30:00"
}
```

---

# 6. REQUEST CHECKING

For every request perform these checks:

### CHECK 1 — IDENTITY

Who is making the request?

```text
Does integrationId exist?
```

If NO:

```text
BLOCK
```

---

### CHECK 2 — ENDPOINT

Is the endpoint allowed?

```text
Is /customers/payment-details
inside the integration's allowedEndpoints?
```

If NO:

```text
+20 RISK
```

---

### CHECK 3 — PURPOSE

Does the requested action match the integration's purpose?

Example:

```text
Analytics Provider
Purpose:
Collect anonymous usage statistics

Request:
GET /customers/payment-details
```

Result:

```text
PURPOSE VIOLATION
+25 RISK
```

---

### CHECK 4 — DATA

Is the integration requesting forbidden data?

Example:

```text
Analytics Provider

Requested:
payment
phone
address
```

Result:

```text
SENSITIVE DATA VIOLATION
+30 RISK
```

---

### CHECK 5 — BEHAVIOUR

Compare current activity against normal activity.

Example:

```text
Normal:
100 requests/min

Current:
1,780 requests/min
```

Result:

```text
ABNORMAL VOLUME
+20 RISK
```

---

### CHECK 6 — CONTEXT

Determine whether the spike could be legitimate.

Example:

```text
Event:
Black Friday

Traffic:
10× normal
```

Do not automatically block.

Instead:

```text
High traffic
+
Expected event
=
Reduced risk
```

---

# 7. RISK ENGINE

Start every request with:

```text
RISK = 0
```

Add:

| Violation               |       Risk |
| ----------------------- | ---------: |
| Unknown integration     |        +50 |
| Unknown endpoint        |        +20 |
| Purpose mismatch        |        +25 |
| Forbidden data          |        +30 |
| New HTTP method         |        +10 |
| Abnormal request volume |        +20 |
| Unusual time            |         +5 |
| Multiple violations     | cumulative |

Maximum:

```text
100
```

---

# 8. RISK LEVELS

```text
0–30     TRUSTED
31–60    SUSPICIOUS
61–80    HIGH RISK
81–100   CRITICAL
```

Display the risk score everywhere in the dashboard.

---

# 9. RESPONSE ENGINE

The system must NOT simply allow/block everything.

### 0–30

```text
ALLOW
```

### 31–60

```text
ALLOW
+
MONITOR
```

### 61–80

```text
RATE LIMIT
+
MONITOR
```

### 81–100

```text
BLOCK
+
QUARANTINE
+
ALERT
```

---

# 10. EXAMPLE

Normal request:

```text
Analytics Provider
GET /analytics/events
Risk: 5

ACTION: ALLOW
```

Suspicious request:

```text
Analytics Provider
GET /customers/profile

Risk:
Unknown endpoint +20
Purpose mismatch +25

TOTAL: 45

ACTION:
ALLOW + MONITOR
```

Attack:

```text
Analytics Provider
GET /customers/payment-details

Requested:
payment
phone
address

Traffic:
1,780 requests/min

Risk:
Purpose mismatch +25
Forbidden data +30
Abnormal volume +20
Unknown endpoint +20

TOTAL: 95

ACTION:
BLOCK + QUARANTINE + ALERT
```

---

# 11. QUARANTINE

When an integration reaches critical risk:

```text
status = QUARANTINED
```

All future requests from that integration are blocked.

Dashboard must show:

```text
Analytics Provider
🔴 QUARANTINED

Risk Score: 95

Reason:
Attempted payment-data access
outside registered purpose.

Additional:
17.8× normal traffic detected.
```

Provide:

```text
[Release Integration]
[Keep Quarantined]
```

---

# 12. SECURITY EVENT

Every violation creates an event.

```json
{
  "integrationId": "analytics_001",
  "endpoint": "/customers/payment-details",
  "eventType": "PURPOSE_VIOLATION",
  "riskScore": 95,
  "action": "BLOCK",
  "reason": "Analytics integration attempted to access payment information",
  "timestamp": "..."
}
```

---

# 13. DASHBOARD

Build one main security dashboard.

## Top statistics

```text
INTEGRATIONS        4
ACTIVE              3
MONITORED REQUESTS  12,480
THREATS             7
QUARANTINED         1
```

---

## Integration table

Columns:

```text
Integration
Purpose
Requests/min
Risk
Status
Last Activity
Action
```

Example:

```text
Analytics      Analytics       1780/min    95    CRITICAL
Payment        Payments         120/min     8    TRUSTED
Delivery       Delivery          80/min    12    TRUSTED
Marketing      Marketing         95/min    22    TRUSTED
```

---

# 14. LIVE INTEGRATION MAP

Create a visual map:

```text
                    ┌───────────────┐
                    │ APPLICATION   │
                    └───────┬───────┘
                            │
                     THIRDEYE
                            │
          ┌─────────────────┼─────────────────┐
          ↓                 ↓                 ↓
      PAYMENT           DELIVERY          ANALYTICS
       🟢 8              🟢 12             🔴 95
```

Clicking an integration opens its Trust Profile.

---

# 15. INTEGRATION DETAIL PAGE

Show:

```text
Analytics Provider

STATUS
QUARANTINED

RISK SCORE
95 / 100

PURPOSE
Collect anonymous usage statistics

ALLOWED ENDPOINTS
✓ /analytics/events
✓ /analytics/metrics

RECENT VIOLATIONS
✕ /customers/payment-details
✕ payment data
✕ phone numbers
✕ abnormal volume
```

Then:

```text
BEHAVIOUR

Normal:      100 req/min
Current:   1,780 req/min
Deviation:     17.8×
```

---

# 16. SECURITY TIMELINE

Create a live event feed:

```text
14:31:05
Analytics requested /analytics/events
ALLOW

14:31:22
Analytics requested /customers/profile
PURPOSE VIOLATION

14:31:28
Analytics requested payment data
HIGH RISK

14:31:35
17.8× traffic detected
CRITICAL

14:31:36
Integration quarantined
```

---

# 17. ATTACK SIMULATOR

This is VERY important for the competition demo.

Create a page:

```text
ATTACK SIMULATOR

Select Integration:
[ Analytics Provider ]

Attack:
[ Credential Compromise ]

[ START ATTACK ]
```

When clicked, generate requests automatically.

### Phase 1

Normal:

```text
/analytics/events
/analytics/metrics
```

Everything green.

### Phase 2

Attack starts:

```text
/customers/profile
/customers/payment-details
/customers/addresses
```

Risk increases.

### Phase 3

Volume increases:

```text
100/min
↓
300/min
↓
800/min
↓
1,780/min
```

### Phase 4

System responds:

```text
RISK: 95

BLOCK
QUARANTINE
ALERT
```

Dashboard updates live.

---

# 18. API ENDPOINTS

Build these backend endpoints:

```text
POST   /api/integrations
GET    /api/integrations
GET    /api/integrations/:id
PATCH  /api/integrations/:id

POST   /api/check-request

GET    /api/security-events
GET    /api/security-events/:id

GET    /api/dashboard/stats
GET    /api/dashboard/activity

POST   /api/simulator/start
POST   /api/simulator/stop

POST   /api/integrations/:id/quarantine
POST   /api/integrations/:id/release
```

---

# 19. DATABASE TABLES

### integrations

```text
id
name
purpose
status
risk_score
expected_request_rate
created_at
updated_at
```

### permissions

```text
id
integration_id
endpoint
method
data_category
access_level
```

### requests

```text
id
integration_id
endpoint
method
data_requested
risk_score
action
timestamp
```

### security_events

```text
id
integration_id
event_type
endpoint
risk_score
reason
action
timestamp
```

### behaviour_profiles

```text
id
integration_id
normal_request_rate
known_endpoints
known_methods
normal_data_categories
```

---

# 20. FRONTEND PAGES

Build only these pages:

```text
/dashboard
/integrations
/integrations/:id
/events
/simulator
/settings
```

### Dashboard

Main security overview.

### Integrations

List all third-party integrations.

### Integration Detail

Trust profile + behaviour + violations.

### Events

Security event timeline.

### Simulator

Live attack demonstration.

### Settings

Risk thresholds and system configuration.

---

# 21. UI REQUIREMENT

The UI should feel like a **modern cybersecurity command center**.

Use:

- dark interface
- clear risk indicators
- cards
- tables
- live activity
- charts
- integration nodes
- event timeline

Do not overcrowd the interface.

---

# 22. TECH STACK

Recommended fast-build stack:

```text
Frontend:
Next.js
TypeScript
Tailwind CSS

Backend:
Node.js
Next.js API routes

Database:
PostgreSQL

ORM:
Prisma

Realtime:
WebSocket / Socket.IO

Charts:
Recharts

Authentication:
Simple demo authentication

Deployment:
Vercel + PostgreSQL
```

For the competition MVP, everything can also run locally.

---

# 23. BUILD ORDER

Do NOT build randomly.

### STEP 1 — Database

Create:

```text
integrations
permissions
requests
security_events
behaviour_profiles
```

---

### STEP 2 — Integration Registry

Create the 4 integrations.

---

### STEP 3 — Trust Profiles

Add purpose, endpoints and allowed/forbidden data.

---

### STEP 4 — Middleware

Create:

```text
checkRequest()
```

Flow:

```text
REQUEST
 ↓
IDENTIFY INTEGRATION
 ↓
CHECK ENDPOINT
 ↓
CHECK PURPOSE
 ↓
CHECK DATA
 ↓
CHECK BEHAVIOUR
 ↓
CHECK CONTEXT
 ↓
CALCULATE RISK
 ↓
DECIDE ACTION
```

---

### STEP 5 — Risk Engine

Implement the scoring rules.

---

### STEP 6 — Response Engine

Implement:

```text
ALLOW
MONITOR
RATE_LIMIT
BLOCK
QUARANTINE
```

---

### STEP 7 — Dashboard

Connect dashboard to real backend data.

---

### STEP 8 — Attack Simulator

Generate realistic malicious requests.

---

### STEP 9 — Realtime Updates

When risk changes:

```text
Backend
 ↓
WebSocket
 ↓
Dashboard
```

Dashboard updates without refresh.

---

# 24. THE DEMO STORY

The entire presentation should follow this sequence:

```text
1. Show 4 trusted integrations.

2. Show their declared purposes.

3. Show live request activity.

4. Start Analytics Provider normally.

5. Trigger "Credential Compromise".

6. Analytics begins accessing customer data.

7. Request volume increases.

8. ThirdEye detects:
   - purpose violation
   - forbidden data
   - abnormal endpoint
   - abnormal volume

9. Risk rises from 8 → 45 → 72 → 95.

10. System moves:
    ALLOW
    →
    MONITOR
    →
    RATE LIMIT
    →
    BLOCK
    →
    QUARANTINE

11. Dashboard explains WHY.

12. Release the integration.

13. Show that normal requests work again.
```

---

# 25. CORE DIFFERENTIATOR

Do not pitch ThirdEye as:

> "Another API monitoring tool."

Pitch it as:

> **"ThirdEye watches your third parties — a continuous trust layer for third-party integrations."**

Existing API security products already provide API discovery, monitoring, schema validation, rate limiting and other protections. Traceable also explicitly monitors third-party API usage and sensitive-data exposure.

Our MVP therefore focuses specifically on:

```text
DECLARED PURPOSE
        +
ALLOWED SCOPE
        +
ACTUAL BEHAVIOUR
        +
CURRENT CONTEXT
        ↓
CONTINUOUS TRUST SCORE
        ↓
GRADED RESPONSE
```

---

# 26. THE ONE SENTENCE

> **ThirdEye continuously verifies that authorized third-party integrations are behaving within their intended purpose and approved scope, then progressively restricts integrations when their behaviour becomes risky.**

---

# 27. DEFINITION OF DONE

The MVP is complete when:

- [ ] 4 integrations exist
- [ ] Each has a Trust Profile
- [ ] Requests pass through middleware
- [ ] Requests receive risk scores
- [ ] Purpose violations are detected
- [ ] Forbidden data access is detected
- [ ] Abnormal volume is detected
- [ ] Context can reduce false positives
- [ ] Risk increases dynamically
- [ ] Actions change according to risk
- [ ] Critical integrations can be quarantined
- [ ] Security events are logged
- [ ] Dashboard updates live
- [ ] Integration map works
- [ ] Attack simulator works
- [ ] Full attack scenario can be demonstrated end-to-end

**If all 16 are working, you have the competition MVP.**
