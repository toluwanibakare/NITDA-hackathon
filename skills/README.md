# ThirdEye Agent Skill (`skills/thirdeye`)

> **Continuous Trust Layer for Third-Party APIs, Outbound Integrations, and AI Agent Tools.**

This directory contains the production-grade **Agent Skill** for ThirdEye. It teaches coding agents (**Antigravity**, **Claude Code**, **Cursor**, **GitHub Copilot**) how to autonomously audit, guard, and verify third-party calls and AI agent tool calls in any codebase.

---

## ⚡ Instant Install into Any Project

Run this one-liner in the root of your project:

```bash
curl -fsSL https://raw.githubusercontent.com/toluwanibakare/thirdeye/main/skills/install.sh | bash
```

Or using `npx degit`:

```bash
# For Antigravity / Gemini CLI / Cursor:
npx degit toluwanibakare/thirdeye/skills/thirdeye .agents/skills/thirdeye

# For Claude Code:
npx degit toluwanibakare/thirdeye/skills/thirdeye .claude/skills/thirdeye
```

> **Global Installation (Optional):**  
> To install once for all projects on your machine:
>
> ```bash
> curl -fsSL https://raw.githubusercontent.com/toluwanibakare/thirdeye/main/skills/install.sh | bash -s -- --global
> ```

---

## 🤖 What Your Coding Agent Can Do

Once installed, open your coding agent (Antigravity, Claude Code, Cursor Composer, Copilot) and prompt it in plain English:

### 1. Audit Integrations for Risk

> _"Audit this project with ThirdEye to identify all outbound third-party APIs, vendor SDKs, and sensitive data fields we are exposing."_

- **Action**: The agent executes `audit_codebase.py` and returns a structured breakdown of all discovered endpoints, HTTP verbs, and sensitive fields (`payment`, `phone`, `password`, `ssn`).

### 2. Generate & Register Trust Profiles

> _"Draft a ThirdEye Trust Profile for our Stripe checkout and register it."_

- **Action**: The agent maps discovered endpoints to `assets/trust-profile-template.json`, defines allowlisted endpoints and forbidden data, and registers it with `register_integration.py`.

### 3. Wire SDK Guards

> _"Guard our outbound vendor calls with `@the-third-eye/sdk` (or `thirdeye-sdk`) so data leaks and traffic spikes are automatically blocked."_

- **Action**: The agent installs the SDK, applies `wrapOutbound` (TS) or `@guard` (Python), and ensures `ThirdEyeBlockedError` stops unauthorized calls.

### 4. Guard AI Agent Tools (Agentic Security)

> _"We have an AI agent calling tools (LangChain / OpenAI tools / MCP). Use ThirdEye to prevent the agent from leaking customer PII or entering runaway tool loops."_

- **Action**: The agent wraps tool execution with ThirdEye scoring before dispatching to external APIs.

### 5. Verify Protection

> _"Run the ThirdEye golden probes to confirm our security guards work as expected."_

- **Action**: The agent runs `test_guard_probe.py --offline` to verify `ALLOW` (score ≤ 30), `MONITOR` (score 45), and `BLOCK` (score 95).

---

## 📁 Directory Structure

```text
skills/
├── install.sh                     # Universal one-line curl installer
├── README.md                      # This documentation
└── thirdeye/
    ├── SKILL.md                   # Main entrypoint with YAML frontmatter (<500 lines)
    ├── scripts/
    │   ├── audit_codebase.py      # AST/regex scanner for outbound HTTP & sensitive fields
    │   ├── test_guard_probe.py    # 3-tier probe verification test (ALLOW, MONITOR, BLOCK)
    │   ├── register_integration.py# HTTP client to register Trust Profiles
    │   ├── check_setup.py         # ThirdEye platform healthcheck
    │   ├── install_agent_skill.sh # Local/global symlink installer
    │   └── verify_skill.sh        # Complete skill contract & SDK test suite
    ├── references/
    │   ├── coding-agent-recipes.md# Drop-in code patterns (Next.js, Express, Python, AI tools)
    │   ├── api-reference.md       # Exact ThirdEye API endpoints & scoring spec
    │   ├── platform-setup.md      # Step-by-step setup guide for API + Supabase
    │   ├── trust-profile-guide.md # How to draft precise Trust Profiles
    │   └── troubleshooting.md     # Resolving common setup & scoring errors
    └── assets/
        ├── dotenv-template        # Environment template
        └── trust-profile-template.json # Template for new vendor profiles
```

---

## 🧪 Verification

To test the entire skill suite locally:

```bash
bash skills/thirdeye/scripts/verify_skill.sh
```

Tests frontmatter validity, discovery symlinks, Python SDK golden tests, TypeScript SDK compilation, and script smoke tests.
