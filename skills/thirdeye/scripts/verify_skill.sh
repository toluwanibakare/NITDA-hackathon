#!/usr/bin/env bash
# Verify the ThirdEye skill + SDKs + cross-agent compatibility. Run from repo root.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"

echo "== skill frontmatter =="
python3 - <<'PY'
import re, sys
p = "skills/thirdeye/SKILL.md"
text = open(p).read()
m = re.match(r"^---\n(.*?)\n---\n", text, re.S)
assert m, "missing YAML frontmatter"
fm = m.group(1)
assert re.search(r"^name:\s*thirdeye(-setup)?\s*$", fm, re.M), fm
assert "description:" in fm
name = re.search(r"^name:\s*(.+)$", fm, re.M).group(1).strip()
assert len(name) <= 64 and name == name.lower(), name
lines = text.count("\n") + 1
assert lines < 500, f"SKILL.md too long: {lines}"
print(f"frontmatter ok, {lines} lines")
PY

echo "== cross-agent skill discovery check =="
test -e "$ROOT/.agents/skills/thirdeye/SKILL.md" || (echo "missing .agents/skills/thirdeye link" && exit 1)
test -e "$ROOT/.claude/skills/thirdeye/SKILL.md" || (echo "missing .claude/skills/thirdeye link" && exit 1)
echo "agent discovery symlinks ok"

echo "== python sdk golden tests =="
PYTHONPATH="$ROOT/packages/sdk-python" python3 -m pytest "$ROOT/packages/sdk-python/tests" -q 2>/dev/null || \
  (cd "$ROOT/packages/sdk-python" && PYTHONPATH=. python3 -m pytest tests -q)

echo "== typescript sdk build+test =="
(npm run build --workspace=@the-third-eye/sdk 2>/dev/null || npm run build --workspace=@thirdeye/sdk 2>/dev/null || (cd "$ROOT/packages/sdk-typescript" && npm run build))
node --test "$ROOT/packages/sdk-typescript/dist/test/"*.test.js

echo "== agent scripts smoke tests =="
python3 "$ROOT/skills/thirdeye/scripts/check_setup.py" --help >/dev/null
python3 "$ROOT/skills/thirdeye/scripts/register_integration.py" --help >/dev/null
python3 "$ROOT/skills/thirdeye/scripts/audit_codebase.py" --help >/dev/null
python3 "$ROOT/skills/thirdeye/scripts/test_guard_probe.py" --offline >/dev/null
echo "verify_skill.sh: ALL OK"
