---
paths:
    - ".github/**"
---

# GitHub Actions conventions

- `deploy.yaml` runs on **push to `main`** and deploys to the **`rise-sandbox`** GCP project/GKE cluster (`europe-west2`). This is a sandbox target — treat it as such; do not point it at prod projects without a deliberate decision.
- Authentication uses the `GCP_SA_KEY` repository secret. Never echo, log, or commit its value. Prefer migrating to Workload Identity (OIDC) over a static SA key if/when this graduates from sandbox.
- Pin third-party actions to a commit SHA or trusted tag; don't float on `@main`.
- Keep the image/namespace names (`pol-github-google-space-webhook`) consistent across `deploy.yaml` and `k8s/`.
