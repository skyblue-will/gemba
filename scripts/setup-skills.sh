#!/bin/bash
# Gemba — Install Claude Code skills
#
# Run this after cloning the repo to register Gemba's
# Claude Code skills as slash commands.
#
# Usage: bash scripts/setup-skills.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
SKILLS_DIR="$HOME/.claude/skills"

echo "Installing Gemba skills..."

# Ensure global skills directory exists
mkdir -p "$SKILLS_DIR"

# Symlink each skill from the repo to the global directory
for skill_dir in "$PROJECT_DIR/.claude/skills"/*/; do
  skill_name=$(basename "$skill_dir")
  target="$SKILLS_DIR/$skill_name"

  if [ -L "$target" ]; then
    echo "  ↻ $skill_name (updating symlink)"
    rm "$target"
  elif [ -d "$target" ]; then
    echo "  ⚠ $skill_name already exists (not a symlink, skipping)"
    continue
  else
    echo "  + $skill_name"
  fi

  ln -sf "$skill_dir" "$target"
done

echo ""
echo "Done. Run /reload-plugins in Claude Code to pick up the new skills."
echo ""
echo "Installed skills:"
for skill_dir in "$PROJECT_DIR/.claude/skills"/*/; do
  skill_name=$(basename "$skill_dir")
  echo "  /$skill_name"
done
