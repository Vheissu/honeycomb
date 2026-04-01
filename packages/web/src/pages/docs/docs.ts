interface CommandGroup {
  title: string;
  command: string[];
  note: string;
}

interface Decision {
  title: string;
  body: string;
}

export class Docs {
  readonly commandGroups: CommandGroup[] = [
    {
      title: 'Install and run',
      command: ['npm install', 'cp .env.example .env', 'npm run dev:api', 'npm run dev:web'],
      note: 'The root scripts build `packages/shared` first so the other packages can consume it immediately.',
    },
    {
      title: 'Build everything',
      command: ['npm run build'],
      note: 'Production builds compile the shared package, API package, and Aurelia app in order.',
    },
    {
      title: 'Run tests',
      command: ['npm run typecheck', 'npm run check', 'npm run test:e2e -w packages/web'],
      note: 'Use `check` for the fast local gate. Browser coverage uses Playwright and starts the API without the Hive indexer.',
    },
  ];

  readonly decisions: Decision[] = [
    {
      title: 'Workspaces over separate apps',
      body: 'Most Hive apps eventually need shared operation ids, payload types, and DTOs. Starting with a monorepo prevents drift between client and server.',
    },
    {
      title: 'A public API manifest',
      body: 'Hive apps usually write to chain and read from an indexer. Publishing `/api/public` makes integrations and docs easier from day one.',
    },
    {
      title: 'Replayable indexing',
      body: 'The starter ships with irreversible-block replay and cursor persistence because chain indexing should not be a late rewrite.',
    },
    {
      title: 'Real auth flows',
      body: 'Keychain and HiveSigner are already modeled in the UI so your app starts from real authentication behavior instead of fake sessions.',
    },
  ];

  readonly nextSteps = [
    'Replace the example operation ids in `packages/shared/src/constants.ts`.',
    'Define your actual payload contracts in `packages/shared/src/types.ts`.',
    'Turn `packages/api/src/indexer/processor.ts` into a handler map for your operation ids.',
    'Add route modules for your app read models under `packages/api/src/routes/`.',
    'Transform the starter pages into your product UI, but keep the auth and API service patterns.',
  ];
}
