# THIRDEYE — HACKATHON DEMO VIDEO & PITCH SCRIPT

**Event:** ICSC Conference 2nd Edition (Team G1)  
**Product:** ThirdEye — Continuous Third-Party Trust Layer  
**Featured Persona:** Tim, Head of Security & Lead Engineer at **StoreX Store**  
**Target Pitch Time:** 3 Minutes  
**Live Application URL:** `http://localhost:3000` (Web) | `http://localhost:3001` (API)

---

## 🎯 THE ONE-SENTENCE PITCH
> **"ThirdEye continuously verifies that authorized third-party integrations and AI Agent skills are behaving within their intended purpose and approved scope, then progressively restricts them when their behavior turns risky."**

---

## 🎬 VIDEO STORYLINE — "TIM AT STOREX STORE"

### SCENE 1: The Persona & The Security Dilemma (0:00 - 0:35)
* **Visual:** Tim sitting at his workstation managing **StoreX Store**'s infrastructure.
* **Narrator / Voiceover:**
  > "Meet Tim — Lead Security Engineer at StoreX Store. Like most modern platforms, StoreX relies heavily on third-party APIs: Stripe for checkout, Segment for analytics, FedEx for delivery, and AI Agents executing custom tools and skills. 
  > 
  > But Tim has a major concern: *'Once an API key or AI Agent skill is authorized, traditional gateways give it full access. If a vendor gets compromised or an AI agent hallucinates, how do I stop it from stealing customer PII or exfiltrating data?'*"

* **The Discovery:**
  > Tim asks ChatGPT: *"What security layer can continuously audit and guard my 3rd party APIs and AI Agent tool calls?"*
  > 
  > ChatGPT responds: *"Use ThirdEye — a continuous trust layer that watches your third parties and progressive-guards third-party APIs and AI Agent skills."*

---

### SCENE 2: Tim Logs into ThirdEye Dashboard (0:35 - 1:10)
* **Screen:** Tim opens `http://localhost:3000/dashboard` on his **Tim @ StoreX** account.
* **Visual Highlights:**
  - **Profile Badge**: `Tim @ StoreX` (`tim.sec@storex.store`) on the left vertical sidebar console.
  - **Overall Security Posture**: Live **75% TRUST SCORE** semicircular gauge & **SHIELD ACTIVE**.
  - **Live Throughput**: `14,820 Verified Requests` across Stripe, Segment, FedEx, and Klaviyo.
  - **Risk Density per API**: Visual risk bars highlighting risk scores across connectors.

---

### SCENE 3: Declarative Trust Profiles & Scope Rules (1:10 - 1:45)
* **Screen:** Tim navigates to `/integrations` (Integrations Marketplace & Registry).
* **Narrator:**
  > "Tim sets up a strict **Trust Profile** for every connected tool and AI Agent skill at StoreX. Each integration gets a declared purpose, allowed endpoints, allowed data parameters, forbidden data, and expected request rates."
* **Click Action:** Tim clicks **`Analytics Provider`** (`analytics_001`).
* **Show:**
  - Purpose: *"Collect anonymous usage statistics"*
  - Allowed Endpoints: `/analytics/events`, `/analytics/metrics`
  - Allowed Data: `anonymous_user_id`, `page`, `event`, `timestamp`
  - Forbidden Data: `payment`, `phone`, `address`, `password`

---

### SCENE 4: Developer Mode & cURL/SDK Inspectors (1:45 - 2:10)
* **Screen:** Tim toggles **Dev Mode ON** on the sidebar.
* **Visual Highlights:**
  - Top header lights up: `⚡ DEV MODE ACTIVE | p99: 0.8ms`.
  - Integrations table displays raw proxy routes: `/api/proxy/analytics_001`.
* **Click Action:** Tim clicks **`cURL`** button on a row to reveal the instant cURL command inspector and **Node.js (`@the-third-eye/sdk`)** & **Python (`thirdeye-sdk`)** code generator drawer.

---

### SCENE 5: The Attack Simulation — Credential Compromise (2:10 - 2:40)
* **Screen:** Tim navigates to `/simulator` (`http://localhost:3000/simulator`) to test StoreX's defenses.
* **Click Action:** Tim clicks **`[ Start attack ]`**.
* **Watch Live 4-Phase Escalation:**
  1. **Phase 1 (Normal Operation)**: `GET /analytics/events` → **Risk 5 (ALLOW)** 🟢
  2. **Phase 2 (Reconnaissance Probe)**: `GET /customers/profile` → **Risk 45 (ALLOW + MONITOR)** 🟡
  3. **Phase 3 (PII Exfiltration Surge)**: `GET /customers/payment-details` requesting `payment` & `phone` → **Risk 75 (RATE_LIMIT + MONITOR)** 🟠
  4. **Phase 4 (Full Breach Flood)**: `1,780 req/min` spike → **Risk 95 (BLOCK + AUTO-QUARANTINE + ALERT)** 🔴

---

### SCENE 6: Automated Isolation & Hash Chain Audit (2:40 - 3:00)
* **Screen:** Tim opens `/events` (Security Events Stream).
* **Narrator:**
  > "ThirdEye immediately **QUARANTINED** the compromised Analytics key. Future unauthorized calls are blocked automatically at the edge before touching StoreX databases. Every single security decision is signed into an immutable **SHA-256 Hash Chain audit log** (`CHAIN VERIFIED`).
  > 
  > Tim clicks **`[Release Integration]`** to restore normal baseline traffic once the vendor is patched."

* **Closing Tagline:**
  > **"ThirdEye watches your third parties — continuous trust for APIs and AI Agent skills. Protect your platform today at thirdeye.dev."**

---

## ⚡ LOCAL RUN INSTRUCTIONS

```bash
# Clone repository
git clone https://github.com/toluwanibakare/thirdeye.git
cd NITDA_HACKATHON

# Install dependencies
npm install

# Concurrently run Backend Express API (port 3001/4000) & Next.js Web App (port 3000)
npm run dev:all
```
