import { BrowserPlatform } from '@aurelia/platform-browser';
import { afterEach, beforeAll } from 'vitest';
import { onFixtureCreated, setPlatform, type IFixture } from '@aurelia/testing';

function bootstrapTestEnv() {
  const platform = new BrowserPlatform(window);
  setPlatform(platform);
  BrowserPlatform.set(globalThis, platform);
}

const fixtures: IFixture<object>[] = [];

beforeAll(() => {
  bootstrapTestEnv();
  onFixtureCreated((fixture) => {
    fixtures.push(fixture);
  });
});

afterEach(() => {
  fixtures.forEach(async (fixture) => {
    try {
      await fixture.stop(true);
    } catch {
      // Ignore fixture shutdown failures in tests.
    }
  });
  fixtures.length = 0;
});
