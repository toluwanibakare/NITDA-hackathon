#!/usr/bin/env bash
# Install / symlink ThirdEye skill for coding agents (Antigravity, Claude Code, Cursor, Copilot).
# Run from repository root or skills directory.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$SKILL_DIR/../.." && pwd)"

INSTALL_GLOBAL=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --global)
      INSTALL_GLOBAL=true
      shift
      ;;
    -h|--help)
      echo "Usage: ./install_agent_skill.sh [--global]"
      echo "  --global    Also install to ~/.claude/skills and ~/.gemini/config/skills"
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

echo "== Installing ThirdEye Agent Skill =="
echo "Source skill: $SKILL_DIR"

# 1. Antigravity / Gemini Workspace Root: .agents/skills/thirdeye
mkdir -p "$REPO_ROOT/.agents/skills"
ln -sfn "../../skills/thirdeye" "$REPO_ROOT/.agents/skills/thirdeye"
echo "✔ Linked for Antigravity: .agents/skills/thirdeye -> skills/thirdeye"

# 2. Claude Code Workspace Root: .claude/skills/thirdeye & .claude/skills/thirdeye-setup
mkdir -p "$REPO_ROOT/.claude/skills"
# Remove old directory copy if present, replace with symlink
if [ -d "$REPO_ROOT/.claude/skills/thirdeye-setup" ] && [ ! -L "$REPO_ROOT/.claude/skills/thirdeye-setup" ]; then
  rm -rf "$REPO_ROOT/.claude/skills/thirdeye-setup"
fi
ln -sfn "../../skills/thirdeye" "$REPO_ROOT/.claude/skills/thirdeye"
ln -sfn "../../skills/thirdeye" "$REPO_ROOT/.claude/skills/thirdeye-setup"
echo "✔ Linked for Claude Code: .claude/skills/thirdeye & thirdeye-setup -> skills/thirdeye"

# 3. Global Installation if requested
if [ "$INSTALL_GLOBAL" = true ]; then
  echo "== Setting up global discovery =="
  mkdir -p "$HOME/.claude/skills"
  ln -sfn "$SKILL_DIR" "$HOME/.claude/skills/thirdeye"
  echo "✔ Global Claude: ~/.claude/skills/thirdeye"

  mkdir -p "$HOME/.gemini/config/skills"
  ln -sfn "$SKILL_DIR" "$HOME/.gemini/config/skills/thirdeye"
  echo "✔ Global Gemini/Antigravity: ~/.gemini/config/skills/thirdeye"
fi

echo "== Installation Complete =="
echo "ThirdEye is now discoverable by Antigravity, Claude Code, and all AgentSkills-compatible coding agents."
