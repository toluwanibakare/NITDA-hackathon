#!/usr/bin/env bash
# One-liner remote installer for ThirdEye Agent Skill
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/toluwanibakare/thirdeye/main/skills/install.sh | bash
#   curl -fsSL https://raw.githubusercontent.com/toluwanibakare/thirdeye/main/skills/install.sh | bash -s -- --global
set -euo pipefail

REPO_OWNER="toluwanibakare"
REPO_NAME="thirdeye"
BRANCH="main"
RAW_BASE="https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/skills/thirdeye"

INSTALL_GLOBAL=false
for arg in "$@"; do
  if [ "$arg" = "--global" ]; then
    INSTALL_GLOBAL=true
  fi
done

echo "🛡️  Installing ThirdEye Agent Skill..."

FILES=(
  "SKILL.md"
  "scripts/audit_codebase.py"
  "scripts/check_setup.py"
  "scripts/install_agent_skill.sh"
  "scripts/register_integration.py"
  "scripts/test_guard_probe.py"
  "scripts/verify_skill.sh"
  "references/api-reference.md"
  "references/coding-agent-recipes.md"
  "references/platform-setup.md"
  "references/troubleshooting.md"
  "references/trust-profile-guide.md"
  "assets/dotenv-template"
  "assets/trust-profile-template.json"
)

download_skill() {
  local target_dir="$1"
  mkdir -p "$target_dir/scripts" "$target_dir/references" "$target_dir/assets"

  for file in "${FILES[@]}"; do
    local url="${RAW_BASE}/${file}"
    local dest="${target_dir}/${file}"
    mkdir -p "$(dirname "$dest")"
    if command -v curl >/dev/null 2>&1; then
      curl -fsSL "$url" -o "$dest"
    elif command -v wget >/dev/null 2>&1; then
      wget -q "$url" -O "$dest"
    else
      echo "Error: Neither curl nor wget found." >&2
      exit 1
    fi
  done

  chmod +x "$target_dir/scripts/"*.py "$target_dir/scripts/"*.sh 2>/dev/null || true
  echo "✔ Installed skill to: $target_dir"
}

if [ "$INSTALL_GLOBAL" = true ]; then
  echo "== Installing globally for all projects =="
  download_skill "$HOME/.agents/skills/thirdeye"
  mkdir -p "$HOME/.claude/skills" "$HOME/.gemini/config/skills"
  cp -rf "$HOME/.agents/skills/thirdeye" "$HOME/.claude/skills/"
  cp -rf "$HOME/.agents/skills/thirdeye" "$HOME/.gemini/config/skills/"
  echo "✅ ThirdEye Agent Skill installed globally!"
else
  echo "== Installing locally into current workspace =="
  download_skill ".agents/skills/thirdeye"
  mkdir -p ".claude/skills"
  cp -rf ".agents/skills/thirdeye" ".claude/skills/"
  echo "✅ ThirdEye Agent Skill installed into .agents/skills/thirdeye and .claude/skills/thirdeye!"
  echo "Your coding agents (Antigravity, Claude Code, Cursor, Copilot) can now use ThirdEye!"
fi
