# Custom JSON Pattern

Honeycomb ships with a typed `custom_json` starter flow because most Hive dApps rely on on-chain operations as their source of truth.

## Starter Envelope

The shared helper creates an envelope shaped like this:

```json
{
  "app": "honeycomb",
  "version": "0.1.0",
  "operationId": "honeycomb_app_action",
  "publishedAt": "2026-03-11T00:00:00.000Z",
  "payload": {
    "kind": "app_action",
    "action": "ping",
    "message": "Hello Hive"
  }
}
```

This is not a Hive requirement. It is a useful convention because it gives the indexer versioned, self-describing payloads.

## Files To Know

- `packages/shared/src/constants.ts`
- `packages/shared/src/types.ts`
- `packages/shared/src/custom-json.ts`
- `packages/api/src/indexer/processor.ts`
- `packages/web/src/services/hive.ts`

## Recommended Rules

- Treat operation ids as a public contract.
- Version payloads explicitly once you have real production traffic.
- Keep payloads small and append-only where possible.
- Index only the operation ids your app actually owns.
- Pair `custom_json` with transfers only when the product truly needs a value-bearing operation.

## Customizing

1. Replace the starter operation ids in `packages/shared/src/constants.ts`.
2. Replace `ExampleActionPayload` and `ExampleCommentPayload` with your app payloads.
3. Update the operation playground in `packages/web/src/pages/playground/`.
4. Add real projection logic to `packages/api/src/indexer/processor.ts`.
