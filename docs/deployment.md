# Deployment Notes

Honeycomb is designed so the same repo can support both local development and a single-service deployment where the API serves the built web app.

## Default Shape

- During development, run the API and web app separately.
- In production, build `packages/web` and `packages/api`, then run the API. If `packages/web/dist` exists, the API will serve it.

## Build

```bash
npm install
npm run build
```

## Required Environment

- `PORT`
- `PUBLIC_WEB_URL`
- `CORS_ORIGIN`
- `HIVE_API_NODES`
- `HIVE_PLATFORM_ACCOUNT`
- `HIVESIGNER_CLIENT_ID`

## Indexer Persistence

The starter persists only its last processed block cursor to `HIVE_INDEXER_STATE_FILE`.

For production apps you will usually want one of these next:

- move cursor persistence into your database
- add projected tables for the operations you care about
- add structured logging around handler failures

## Railway / Single-Service Platforms

This starter is compatible with the same pattern used in recent Hive apps:

- build the workspace
- run the API package as the entrypoint
- let the API serve `packages/web/dist`

That keeps deployment simple while preserving a clean dev-time split between frontend and backend.
