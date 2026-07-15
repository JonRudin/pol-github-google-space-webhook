# AGENTS.md

This file provides guidance to AI developer agents when working with code in this repository.

## What this repo is

A small **Express (TypeScript) webhook service** that receives GitHub webhook events and forwards formatted notifications to Google Chat spaces for the Payment Orchestration Layer (POL) team.

- Listens on `POST /github-webhook` for GitHub events (currently `pull_request` `opened`/`closed`).
- Only reacts to events for the `ovotech/rise-pol` repository; everything else is acknowledged with `200` and ignored.
- Posts a formatted message to a Google Chat incoming-webhook URL, threading replies by `threadKey` (`REPLY_MESSAGE_FALLBACK_TO_NEW_THREAD`) so a PR's updates stay in one thread.
- Routes to a default space (`polGithubNotifications`) or a QA space (`polGithubNotificationsQA`) via environment variables.

## Repo structure

```
src/index.ts        # The whole service — Express app, webhook handler, Chat forwarding
k8s/                # Kubernetes manifests (deployment.yaml, service.yaml)
Dockerfile          # Container build
.github/workflows/  # deploy.yaml — build + deploy to GCP sandbox on push to main
```

## Key commands

```bash
npm install         # Install dependencies
npm run dev         # Run locally with ts-node (src/index.ts)
npm run build       # Compile TypeScript to dist/ (tsc)
npm start           # Run the compiled build (node dist/index.js)
```

The service listens on `PORT` (defaults to 8080 in the k8s deployment).

## Configuration / secrets

Config comes from environment variables (loaded via `dotenv` locally; injected from a Kubernetes secret `pol-github-google-space-webhook-secrets` in-cluster):

- `polGithubNotifications` — default Google Chat incoming-webhook URL
- `polGithubNotificationsQA` — QA Google Chat webhook URL
- `PORT`, `NODE_ENV`

**Never commit real webhook URLs or secrets.** Keep them in `.env` locally (gitignored) and the k8s secret in-cluster.

## Deployment

`.github/workflows/deploy.yaml` runs on push to `main`: authenticates to GCP, builds the Docker image, pushes it to Artifact Registry (`europe-west2-docker.pkg.dev/rise-sandbox/...`), and rolls the deployment in the `pol-github-google-space-webhook` namespace on the `rise-sandbox` GKE cluster. This is a **sandbox** deployment.

## Code conventions

- **UK English** in docs, comments, and identifiers where natural.
- Prefer `async/await` over raw Promise chains.
- `const` by default; `let` only when reassignment is required.
- Keep the service small and readable — it is a single-purpose forwarder. Add a comment only where it captures something the code cannot (a GitHub payload quirk, a Chat API constraint), not to restate the code.
- Validate/narrow untyped GitHub payload fields before using them; guard against missing `pull_request`/`labels`/`assignees`.

## Git & PR workflow

- Never commit directly to the default branch (`main`); branch first and land changes via a reviewed PR (a Claude PreToolUse hook enforces this).
- Keep PRs small and single-purpose; the description explains _why_, not _what_.
