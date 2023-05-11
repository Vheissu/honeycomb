import { MongoClient } from "mongodb";
import { DatabaseAdapter } from "./adapter";

export class MongoDBAdapter implements DatabaseAdapter {
  private client: MongoClient;
  private dbName: string;
  private db: any;

  constructor(mongoUri: string, dbName: string) {
    this.client = new MongoClient(mongoUri);
    this.dbName = dbName;
  }

  async connect() {
    await this.client.connect();
    this.db = this.client.db(this.dbName);
  }

  async disconnect() {
    await this.client.close();
  }

  async saveTransaction(transaction: any) {
    await this.db.collection("transactions").insertOne(transaction);
  }

  async getLatestBlockNumber() {
    const latestBlock = await this.db.collection("blocks").findOne({}, { sort: { blockNumber: -1 } });
    return latestBlock ? latestBlock.blockNumber : 0;
  }

  async updateLatestBlockNumber(blockNumber: number) {
    await this.db.collection("blocks").updateOne({}, { $set: { blockNumber } }, { upsert: true });
  }

  async createTable(tableName: string, schema: string): Promise<void> {
    // MongoDB doesn't require schema creation, so this method is not needed
  }

  async updateTable(tableName: string, data: any, condition: any): Promise<void> {
    await this.db.collection(tableName).updateOne(condition, { $set: data });
  }
}
