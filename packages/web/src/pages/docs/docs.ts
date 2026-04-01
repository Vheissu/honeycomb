interface CommandGroup {
  title: string;
  command: string[];
  note: string;
}

interface Decision {
  title: string;
  body: string;
}

interface StarterExpectation {
  title: string;
  body: string;
  file: string;
}

export class Docs {
  readonly commandGroups: CommandGroup[] = [
    {
      title: 'Install and run',
      command: ['npm install', 'cp .env.example .env', 'npm run dev'],
      note: 'The root dev script starts both packages together so the starter feels usable immediately after clone.',
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
    'Replace the example projection in `packages/api/src/indexer/recent-operations.ts` with your real read models.',
    'Add route modules for your app read models under `packages/api/src/routes/`.',
    'Transform the starter pages into your product UI, but keep the auth and API service patterns.',
  ];

  readonly starterExpectations: StarterExpectation[] = [
    {
      title: 'Fast local startup',
      body: 'A serious starter should not require two memorized commands before anything renders. The root workspace now exposes a single dev command.',
      file: 'package.json',
    },
    {
      title: 'CI before first feature',
      body: 'A new team expects the repo to prove it can typecheck, unit test, and run a smoke browser pass in automation from day one.',
      file: '.github/workflows/ci.yml',
    },
    {
      title: 'A visible read-model example',
      body: 'Indexing should produce something you can inspect. The recent-operations projection shows how to turn chain events into a consumable API shape.',
      file: 'packages/api/src/indexer/recent-operations.ts',
    },
  ];
}
