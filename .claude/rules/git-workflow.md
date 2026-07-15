# Git Workflow

<!-- No path scope - rules apply globally across the repo -->

- **Never commit directly to the default branch.** Branch first (`git checkout -b <short-slug>`) and land every change via a reviewed PR. A PreToolUse hook blocks commits made on the default branch.
- **Keep PRs small and single-purpose.** Split work into the smallest independently-reviewable, independently-revertable units. Refuse to bundle unrelated changes or broad refactors into one PR.
- **PR descriptions explain _why_, not _what_** — the diff already shows what changed. Keep it tight; drop empty sections rather than padding with "N/A". No AI slop.
- **Never push, pull, or fetch without being asked** — these are `ask`-gated. Do not add or rewrite git remotes.
