# THIRDEYE — HACKATHON LIVE DEMO & PITCH SCRIPT

**Event:** ICSC Conference 2nd Edition (Team G1)  
**Product:** ThirdEye — Continuous Third-Party Trust Layer  
**Target Pitch Time:** 3 Minutes  
**Live URL:** `http://localhost:3000` (Web) | `http://localhost:3001` (API)

---

## 🎯 THE ONE-SENTENCE PITCH
> **"ThirdEye continuously verifies that authorized third-party integrations are behaving within their intended purpose and approved scope, then progressively restricts them when their behavior becomes risky."**

---

## 🎬 13-STEP LIVE DEMO WALKTHROUGH (PRD §24)

### STEP 1: The Problem & Dashboard Overview (0:00 - 0:30)
* **Action:** Open `http://localhost:3000/dashboard` in Executive (Merchant) Mode.
* **Speaker:** 
  > "Modern web apps rely on dozens of authorized third-party APIs — payment processors, analytics tools, logistics SDKs. But once authorized, traditional gateways give them total carte blanche. If a partner key is leaked or compromised, they silently exfiltrate user data. ThirdEye solves this by adding a continuous, scope-aware trust layer."
* **Visual Highlights to Point Out:**
  - **Overall Security Posture Gauge**: Displays live **75% TRUST SCORE** & **Shield Active**.
  - **Category Donut & Risk Density Bars**: Shows live throughput (`14,820 API Calls`) across connectors.

---

### STEP 2: Third-Party Trust Registry & Declarative Scope (0:30 - 1:00)
* **Action:** Navigate to `/integrations` or inspect the **Integration Trust Registry** table.
* **Speaker:**
  > "ThirdEye registers every third-party integration with a strict **Trust Profile**: declared purpose, allowed endpoints, allowed data parameters, forbidden data, and expected rate limits."
* **Click Action:** Click on **`Analytics Provider`** (`analytics_001`).
* **Show:**
  - Allowed Endpoints: `/analytics/events`, `/analytics/metrics`
  - Allowed Data: `anonymous_user_id`, `event`, `timestamp`
  - Forbidden Data: `payment`, `phone`, `address`, `password`
  - Baseline Rate: `100 req/min`

---

### STEP 3: Developer & Security Engineer Mode (1:00 - 1:30)
* **Action:** Click the **Dev Mode** toggle switch on the left sidebar.
* **Speaker:**
  > "With one toggle, developers unlock low-level proxy telemetry — P99 latency (`0.8ms`), raw HTTP status codes, and instant copyable cURL & SDK snippets (`@the-third-eye/sdk`)."
* **Click Action:** Click **`cURL`** button on any table row to show the cURL command & Node.js code generator modal.

---

### STEP 4: Live Attack Simulation & Graded Escalation (1:30 - 2:30)
* **Action:** Navigate to `/simulator` (`http://localhost:3000/simulator`).
* **Speaker:**
  > "Now let me show you ThirdEye in action under a live credential compromise attack."
* **Click Action:** Click **`[ Start attack ]`**.
* **Watch live progression across 4 Phases:**
  1. **Phase 1 (Normal Operation)**: `GET /analytics/events` → **Risk 5 (ALLOW)** 🟢
  2. **Phase 2 (Endpoint Reconnaissance)**: `GET /customers/profile` → **Risk 45 (ALLOW + MONITOR)** 🟡
  3. **Phase 3 (Data Exfiltration Surge)**: `GET /customers/payment-details` requesting `payment` & `phone` → **Risk 75 (RATE_LIMIT + MONITOR)** 🟠
  4. **Phase 4 (Full Breach Spike)**: `1,780 req/min` spike accessing PII → **Risk 95 (BLOCK + QUARANTINE + ALERT)** 🔴

---

### STEP 5: Automated Isolation & Cryptographic Audit (2:30 - 3:00)
* **Action:** Switch to `/events` (Security Events Stream).
* **Speaker:**
  > "Notice how Analytics was immediately **QUARANTINED**. All future requests from this key are blocked instantly before touching backend services. Furthermore, every decision is locked into an immutable **SHA-256 Hash Chain audit log** verified on chain."
* **Click Action:** Click **`[Release Integration]`** on `/integrations/analytics_001` or overview to show instant restoration to normal baseline.
* **Closing Sentence:**
  > "ThirdEye doesn't just block APIs — it continuously watches third parties so your enterprise stays secure. Thank you!"

---

## ⚡ QUICK TROUBLESHOOTING & RUN COMMANDS

```bash
# Clone & run locally
git clone https://github.com/toluwanibakare/thirdeye.git
cd NITDA_HACKATHON

# Install dependencies
npm install

# Run backend API and Next.js frontend concurrently
npm run dev:all
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:3001`
