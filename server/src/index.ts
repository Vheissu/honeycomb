import { Streamer } from 'hive-stream';
import { createNftContract } from './contracts/nft.js';
import { createCoinflipContract } from './contracts/coinflip.js';

const streamer = new Streamer({
  jsonId: 'honeycomb',
  debugMode: true,
});

await streamer.registerContract(createNftContract());
await streamer.registerContract(createCoinflipContract());

console.log('[honeycomb] Starting streamer…');
await streamer.start();
