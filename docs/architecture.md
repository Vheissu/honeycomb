# Architecture

Honeycomb is structured around the core split that keeps Hive apps maintainable:

1. The web app authenticates the user and broadcasts blockchain operations.
2. The API exposes safe runtime configuration, public read models, and diagnostics.
3. The indexer turns blockchain activity into app-specific projections.
4. `packages/shared` keeps operation ids and payload types consistent everywhere.

## Package Responsibilities

### `packages/shared`

- Defines starter operation ids
- Owns shared DTOs and helper types
- Builds and parses `custom_json` envelopes
- Validates Hive usernames and operation prefixes

Keep anything that both the frontend and backend need to agree on here.

### `packages/api`

- Loads and validates environment variables once
- Creates a Fastify app with public, read-only routes
- Talks to Hive RPC through `dhive`
- Runs a resumable irreversible-block indexer
- Exposes health and indexer status for local development and production monitoring

The indexer intentionally persists only its cursor by default. Once your app's read models solidify, add your database layer and project operations into tables.

### `packages/web`

- Provides the starter shell, docs pages, and operation playground
- Manages Hive Keychain and HiveSigner session state
- Knows how to broadcast starter `custom_json` operations
- Uses the API manifest/config routes to stay in sync with backend runtime settings

## Request Flow

1. A user signs in via Hive Keychain or HiveSigner.
2. The frontend builds a typed payload with `@honeycomb/shared`.
3. The frontend signs and broadcasts the operation to Hive.
4. The API indexer sees the operation on the irreversible chain stream.
5. The indexer records cursor progress and dispatches matching operations for projection.
6. Public routes return the resulting read model or current runtime status.

## Why The API Is Read-Only By Default

Most Hive dApps are more robust when blockchain writes stay in the client and the API focuses on:

- config
- indexing
- derived reads
- diagnostics

That keeps trust boundaries clearer and reduces the amount of duplicated business logic across chain and server code.

## Extending Honeycomb

Typical next steps:

- Add a persistent database for your projections
- Split the indexer processor into handler modules per operation id
- Add route-level validation for new endpoints
- Add frontend service modules for your app domain
- Replace the example playground with real product workflows
