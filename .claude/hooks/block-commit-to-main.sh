#!/usr/bin/env bash
# PreToolUse(Bash) guard: refuse a git commit made directly on the default branch.
# All changes should land via a reviewed PR from a short-lived feature branch.
set -euo pipefail

cmd=$(jq -r '.tool_input.command // ""')

case "$cmd" in
*"git commit"*) ;;
*) exit 0 ;;
esac

branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")

# Resolve the repo's default branch (origin/HEAD), falling back to main/master.
default=$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null | sed 's#^origin/##')
if [ -z "$default" ]; then
  if git show-ref --verify --quiet refs/heads/main; then
    default="main"
  elif git show-ref --verify --quiet refs/heads/master; then
    default="master"
  else default="main"; fi
fi

if [ "$branch" = "$default" ]; then
  jq -n --arg b "$branch" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: ("Blocked: HEAD is on `" + $b + "` (the default branch). Land changes via a reviewed PR from a short-lived feature branch. Branch first, e.g.: git checkout -b <short-slug>")
    }
  }'
fi
exit 0
