import { resolve } from 'aurelia';
import type { ApiHealth, AppManifest } from '@honeycomb/shared';
import { ApiService } from '../../services/api';

interface Principle {
  title: string;
  body: string;
}

export class Home {
  private api: ApiService = resolve(ApiService);

  manifest: AppManifest | null = null;
  health: ApiHealth | null = null;
  loadError: string | null = null;

  readonly principles: Principle[] = [
    {
      title: 'Typed contracts',
      body: 'The starter keeps operation ids, API DTOs, and payload helpers in one shared package so the stack stays coherent as the app grows.',
    },
    {
      title: 'On-chain writes, read-only API',
      body: 'Honeycomb assumes most mutations happen on Hive while the backend focuses on projection, config, and public reads.',
    },
    {
      title: 'Indexer first',
      body: 'The API includes replay and resume out of the box so teams do not treat indexing as an afterthought.',
    },
    {
      title: 'Serious frontend baseline',
      body: 'Aurelia 2, Tailwind v4, routing, auth, and a live playground are already wired so you can start with real product structure.',
    },
  ];

  readonly quickStartSteps = [
    'npm install',
    'cp .env.example .env',
    'npm run dev:api',
    'npm run dev:web',
  ];

  async binding(): Promise<void> {
    try {
      const [manifest, health] = await Promise.all([
        this.api.getManifest(),
        this.api.getHealth(),
      ]);

      this.manifest = manifest;
      this.health = health;
    } catch (error) {
      this.loadError = error instanceof Error ? error.message : 'Failed to load starter status.';
    }
  }
}
