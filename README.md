# File Storage Platform Frontend

Next.js App Router interface for the file storage platform. Use `pnpm` and Node.js 22 (see `.nvmrc`).

## Local development

Copy `.env.example` to `.env` and set the browser API URL, internal API URL, and application origin for your local services. Run `pnpm install`, then `pnpm dev`. Run `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` before opening a pull request.

## Build the Docker image

From this repository directory in PowerShell, pass the two **public production URLs** explicitly. Replace the example domains with your own values:

```powershell
docker build `
  --build-arg "NEXT_PUBLIC_APP_URL=https://app.example.com" `
  --build-arg "NEXT_PUBLIC_API_BASE_URL=https://api.example.com/api/v1" `
  -t "nivz0911/file-storage-platform-frontend:latest" .
```

The local `.env` file is excluded from the Docker build context and is not read by `docker build`. `NEXT_PUBLIC_*` values are embedded in the browser bundle during `next build`; rebuild the image if either public URL changes. `API_INTERNAL_URL` defaults to `http://backend:4000/api/v1` inside the production Compose network and is supplied to the container at runtime. The current InstaBox Compose bundle and first-start steps are in `../file-storage-platform-infra/README.instabox.md` in the shared workspace.

The GitHub `Quality` workflow verifies pull requests. On `main`, it publishes `latest` and commit-SHA images using the repository variables `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_API_BASE_URL`, then deploys that SHA to InstaBox. The separate deploy workflow can release a selected SHA manually.
