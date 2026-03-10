# Honeycomb

Honeycomb is a modern starter kit for Hive dApps. It gives you a clear baseline for the stack that has worked best in recent Hive projects:

- Aurelia 2 frontend with TypeScript and Tailwind CSS v4
- Node.js API with Fastify
- Shared TypeScript contracts for frontend/backend consistency
- A resumable Hive indexer skeleton for `custom_json`-driven apps
- Real Hive auth scaffolding for Hive Keychain and HiveSigner

This repository is intentionally opinionated. The goal is not to be the smallest possible template. The goal is to be the starter people reach for when they want to ship a serious Hive app without rebuilding the same plumbing every time.

## Architecture

Honeycomb is an npm workspaces monorepo:

| Package | Purpose | Stack |
| --- | --- | --- |
| `packages/shared` | Shared contracts, operation ids, helpers, validation | TypeScript, Vitest |
| `packages/api` | Public API, safe runtime config, Hive account lookups, indexer process | Fastify, dhive, Zod |
| `packages/web` | Starter UI, docs surface, auth shell, operation playground | Aurelia 2, Vite, Tailwind CSS v4 |

Detailed docs:

- [docs/architecture.md](docs/architecture.md)
- [docs/custom-json.md](docs/custom-json.md)
- [docs/deployment.md](docs/deployment.md)

## What You Get

- Workspace layout aligned with how production Hive apps tend to evolve
- Shared `custom_json` helpers so the backend and frontend agree on payload shape
- A generic indexer that can replay, resume, and watch selected operation ids
- `/api/public`, `/api/config`, `/api/health`, `/api/accounts/:username`, and `/api/indexer/status`
- A polished web starter that doubles as live docs and a transaction playground
- Hive Keychain and HiveSigner auth scaffolding you can extend instead of rewriting

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev:api
```

In a second terminal:

```bash
npm run dev:web
```

Default local URLs:

- Web: `http://localhost:5173`
- API: `http://localhost:3000`

## Environment Variables

Copy `.env.example` to `.env` and adjust as needed.

Core API variables:

- `HOST` / `PORT`
- `CORS_ORIGIN`
- `PUBLIC_WEB_URL`
- `HIVE_API_NODES`
- `HIVE_PLATFORM_ACCOUNT`
- `HIVESIGNER_CLIENT_ID`
- `HIVE_OPERATION_PREFIX`
- `HIVE_INDEXER_ENABLED`
- `HIVE_INDEXER_START_BLOCK`
- `HIVE_INDEXER_STATE_FILE`

Core web variables:

- `VITE_API_URL`
- `VITE_HIVE_APP_NAME`
- `VITE_HIVE_PLATFORM_ACCOUNT`
- `VITE_HIVESIGNER_CLIENT_ID`
- `VITE_HIVESIGNER_REDIRECT_URI`
- `VITE_HIVE_OPERATION_PREFIX`

`packages/web` is configured to load env vars from the repo root so the whole starter can be driven from one `.env` file.

## Recommended Workflow

1. Rename the repo and update the public copy in `README.md`, `.env.example`, and `packages/shared/src/constants.ts`.
2. Replace the example operation ids in `packages/shared` with your app's real contract ids.
3. Extend the indexer processor in `packages/api/src/indexer/processor.ts` with handlers for your operations.
4. Add your read models and route modules in `packages/api/src/routes/`.
5. Turn the starter pages in `packages/web/src/pages/` into your actual product UI.

## Commands

```bash
npm run build                # build all packages
npm test                     # run package tests
npm run dev:api              # start the API + indexer
npm run dev:web              # start the Aurelia app

npm run build -w packages/shared
npm run build -w packages/api
npm run build -w packages/web
```

## Starter Philosophy

Honeycomb assumes that most Hive app writes happen on-chain and the API is primarily for indexing, projection, and public reads. That is why the defaults lean toward:

- a public read-only API manifest
- typed on-chain payloads in `packages/shared`
- auth and broadcast logic in the frontend
- indexing and projection in the backend

If your app needs server-authorized writes, background jobs, or heavier persistence, treat this repo as the baseline and add those concerns deliberately.
