import { BlockchainMode, Client } from '@hiveio/dhive';
import { PlatformDefaults } from '@honeycomb/shared';
import { getConfig, getHiveApiNodes } from '../config.js';
import { processBlock } from './processor.js';
import {
  getIndexerStatus,
  initializeIndexerState,
  loadPersistedBlock,
  persistLastProcessedBlock,
  updateIndexerState,
} from './state-store.js';

let running = false;
let runPromise: Promise<void> | null = null;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function selectSyncedNodes(nodes: string[]): Promise<string[]> {
  const checks = await Promise.all(
    nodes.map(async (node) => {
      try {
        const client = new Client([node], { timeout: 8_000, failoverThreshold: 1 });
        const props = await client.database.getDynamicGlobalProperties();
        return {
          node,
          head: props.last_irreversible_block_num,
        };
      } catch {
        return {
          node,
          head: -1,
        };
      }
    }),
  );

  const healthy = checks.filter((check) => check.head > 0);
  if (healthy.length === 0) {
    return nodes;
  }

  const maxHead = Math.max(...healthy.map((check) => check.head));
  return healthy
    .filter((check) => maxHead - check.head <= 25)
    .sort((left, right) => right.head - left.head)
    .map((check) => check.node);
}

async function getHeadBlockNumber(client: Client): Promise<number> {
  return client.blockchain.getCurrentBlockNum(BlockchainMode.Irreversible);
}

async function replayBlocks(client: Client, from: number, to: number): Promise<void> {
  for (let blockNum = from; blockNum <= to && running; blockNum += 1) {
    const block = await client.database.getBlock(blockNum);
    if (!block) {
      continue;
    }

    await processBlock(blockNum, block);
    await persistLastProcessedBlock(blockNum);
  }
}

async function streamBlocks(client: Client, fromBlock: number): Promise<void> {
  let nextBlock = fromBlock;

  while (running) {
    try {
      const head = await getHeadBlockNumber(client).catch(() => null);
      if (head !== null && nextBlock > head) {
        await sleep(1_500);
        continue;
      }

      const stream = client.blockchain.getBlockStream({
        from: nextBlock,
        mode: BlockchainMode.Irreversible,
      });

      let blockNum = nextBlock;
      for await (const block of stream) {
        if (!running) {
          break;
        }

        await processBlock(blockNum, block);
        await persistLastProcessedBlock(blockNum);
        blockNum += 1;
      }

      nextBlock = blockNum;
    } catch (error) {
      updateIndexerState({
        lastError: error instanceof Error ? error.message : 'Indexer stream failed',
      });
      await sleep(2_000);
    }
  }
}

export async function startIndexer(): Promise<void> {
  if (runPromise) {
    return runPromise;
  }

  initializeIndexerState();

  if (!getConfig().HIVE_INDEXER_ENABLED) {
    updateIndexerState({
      enabled: false,
      running: false,
    });
    return;
  }

  running = true;
  updateIndexerState({
    enabled: true,
    running: true,
    lastError: null,
  });

  runPromise = (async () => {
    try {
      const nodes = await Promise.race([
        selectSyncedNodes(getHiveApiNodes()),
        (async () => {
          await sleep(5_000);
          return getHiveApiNodes();
        })(),
      ]);

      const client = new Client(nodes, { timeout: 8_000, failoverThreshold: 1 });
      updateIndexerState({
        connectedNode: nodes[0] ?? null,
      });

      const head = await getHeadBlockNumber(client);
      const persistedBlock = await loadPersistedBlock();

      let startFrom = getConfig().HIVE_INDEXER_START_BLOCK ?? persistedBlock ?? head;
      const minReplayBlock = Math.max(head - PlatformDefaults.INDEXER_REPLAY_WINDOW, 1);

      if (!getConfig().HIVE_INDEXER_START_BLOCK && startFrom < minReplayBlock) {
        startFrom = minReplayBlock;
      }

      if (startFrom < head) {
        await replayBlocks(client, startFrom, head);
        await streamBlocks(client, head + 1);
        return;
      }

      await streamBlocks(client, startFrom);
    } catch (error) {
      updateIndexerState({
        lastError: error instanceof Error ? error.message : 'Indexer failed to start',
      });
      throw error;
    } finally {
      running = false;
      updateIndexerState({
        running: false,
      });
      runPromise = null;
    }
  })();

  return runPromise;
}

export function stopIndexer(): void {
  running = false;
  updateIndexerState({
    running: false,
  });
}

export function getLiveIndexerStatus() {
  return getIndexerStatus();
}
