export const DefaultHiveApiNodes = [
  'https://api.hive.blog',
  'https://api.deathwing.me',
  'https://api.openhive.network',
] as const;

export const OperationIds = {
  APP_BOOTSTRAP: 'honeycomb_app_bootstrap',
  APP_ACTION: 'honeycomb_app_action',
  APP_COMMENT: 'honeycomb_app_comment',
} as const;

export type OperationId = (typeof OperationIds)[keyof typeof OperationIds];

export const ALL_OPERATION_IDS = Object.values(OperationIds);

export const SupportedAuthProviders = ['keychain', 'hivesigner'] as const;

export type SupportedAuthProvider = (typeof SupportedAuthProviders)[number];

export const PlatformDefaults = {
  APP_NAME: 'Honeycomb',
  APP_TAGLINE: 'Opinionated Hive dApp starter',
  APP_DESCRIPTION:
    'Ship Hive apps with an Aurelia 2 frontend, Node.js API, shared contracts, and an indexer baseline.',
  API_PORT: 3000,
  WEB_PORT: 5173,
  INDEXER_STATE_FILE: '.data/indexer-state.json',
  INDEXER_REPLAY_WINDOW: 10_000,
} as const;
