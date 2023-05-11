import { Client } from "@hiveio/dhive";
import { HiveStreamer } from "./hive-streamer";
import { MongoDBAdapter } from "./database/mongodb-adapter";
import { SQLiteAdapter } from "./database/sqlite-adapter";
import { CoinflipContract } from "./contracts/coinflip";

async function main() {
  const client = new Client("https://api.hive.blog");
  const dbAdapter = new MongoDBAdapter(/* MongoDB connection config */); // or new SQLiteAdapter(/* SQLite connection config */);

  await dbAdapter.connect();

  const hiveStreamer = new HiveStreamer(client, dbAdapter);

  // Register the coinflip contract
  const coinflipContract = new CoinflipContract();
  hiveStreamer.registerContract(coinflipContract);

  hiveStreamer.startStreaming();

  // To stop streaming after some time, you can use:
  // setTimeout(() => hiveStreamer.stopStreaming(), 10000);
}

main();
