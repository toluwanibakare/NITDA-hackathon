#!/usr/bin/env bash
# Package and export ThirdEye skill into a standalone git repository for:
# https://github.com/toluwanibakare/thirdeye-skill
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
TARGET_DIR="${1:-/tmp/thirdeye-skill}"

echo "📦 Exporting standalone skill repository to: $TARGET_DIR"
rm -rf "$TARGET_DIR"
mkdir -p "$TARGET_DIR/scripts" "$TARGET_DIR/references" "$TARGET_DIR/assets"

# Copy skill core files
cp "$SKILL_DIR/SKILL.md" "$TARGET_DIR/"
cp "$SKILL_DIR/references/"*.md "$TARGET_DIR/references/"
cp "$SKILL_DIR/assets/"* "$TARGET_DIR/assets/"
cp "$SKILL_DIR/scripts/"* "$TARGET_DIR/scripts/"
chmod +x "$TARGET_DIR/scripts/"*.py "$TARGET_DIR/scripts/"*.sh

# Create Root README.md for the standalone repository
cat << 'EOF' > "$TARGET_DIR/README.md"
# ThirdEye Agent Skill (`thirdeye-skill`)

> **Continuous Trust Layer for Third-Party APIs, Outbound Integrations, and AI Agent Tools.**

This repository contains the standalone **Agent Skill** for [ThirdEye](https://github.com/toluwanibakare/thirdeye). It enables coding agents (**Antigravity**, **Claude Code**, **Cursor**, **GitHub Copilot**) to autonomously audit, guard, and verify third-party calls in any codebase.

---

## 🚀 Quick Install

### Method 1: One-Line cURL Install
Run in the root of your project:
```bash
curl -fsSL https://raw.githubusercontent.com/toluwanibakare/thirdeye-skill/main/scripts/install_agent_skill.sh | bash
```

### Method 2: npx degit (No git clone needed)
```bash
# For Antigravity / Gemini CLI / Cursor:
npx degit toluwanibakare/thirdeye-skill .agents/skills/thirdeye

# For Claude Code:
npx degit toluwanibakare/thirdeye-skill .claude/skills/thirdeye
```

### Method 3: Git Submodule or Direct Clone
```bash
git clone https://github.com/toluwanibakare/thirdeye-skill.git .agents/skills/thirdeye
git clone https://github.com/toluwanibakare/thirdeye-skill.git .claude/skills/thirdeye
```

---

## 🤖 How to Use with Your Coding Agent

Once installed, just prompt your agent in plain English:

- **Audit integrations**:  
  _"Audit this project with ThirdEye to find all external API calls and sensitive parameters."_
- **Create Trust Profile**:  
  _"Generate a ThirdEye Trust Profile for Stripe and SendGrid and register it."_
- **Wire SDK guards**:  
  _"Guard our checkout API route with `@the-third-eye/sdk` (or `thirdeye-sdk`) against exfiltration."_
- **Guard AI Agent tools**:  
  _"Guard our LangChain / OpenAI tool calls with ThirdEye so the agent cannot leak PII."_
- **Verify**:  
  _"Run the ThirdEye golden probes to confirm our guards work."_

---

## 📂 Contents

- `SKILL.md`: Main entrypoint with YAML frontmatter (<500 lines).
- `scripts/audit_codebase.py`: Scans codebases for outbound HTTP calls, endpoints, and sensitive fields.
- `scripts/test_guard_probe.py`: Runs golden verification probes (ALLOW, MONITOR, BLOCK).
- `scripts/register_integration.py`: Registers Trust Profiles via HTTP.
- `scripts/check_setup.py`: Validates ThirdEye platform health.
- `references/coding-agent-recipes.md`: Drop-in patterns for Next.js, Express, Python, and AI tools.
- `references/api-reference.md`: Complete ThirdEye API contracts.
- `references/trust-profile-guide.md`: Detailed guide on drafting Trust Profiles.

---

## 🔗 Main Project
For the full ThirdEye platform (Next.js Dashboard, Express API risk engine, and Supabase schema), visit [toluwanibakare/thirdeye](https://github.com/toluwanibakare/thirdeye).
EOF

# Copy installer to root of standalone repo as install.sh
cp "$TARGET_DIR/scripts/install_agent_skill.sh" "$TARGET_DIR/install.sh"
chmod +x "$TARGET_DIR/install.sh"

echo "✔ Standalone skill repository generated at $TARGET_DIR"
echo ""
echo "To publish to GitHub:"
echo "  cd $TARGET_DIR"
echo "  git init"
echo "  git add ."
echo "  git commit -m 'feat: initial release of ThirdEye agent skill'"
echo "  git branch -M main"
echo "  git remote add origin https://github.com/toluwanibakare/thirdeye-skill.git"
echo "  git push -u origin main"
