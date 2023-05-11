import { Client } from "@hiveio/dhive";
import { MongoClient } from "mongodb";

export class HiveStreamer {
  private client: Client;
  private mongoClient: MongoClient;
  private dbName: string;
  private streaming: boolean;
  private currentBlockNumber: number;
  private contracts: Map<string, Contract>;

  constructor(client: Client, mongoUri: string, dbName: string) {
    this.client = client;
    this.mongoClient = new MongoClient(mongoUri);
    this.dbName = dbName;
    this.streaming = false;
    this.currentBlockNumber = 0;
    this.contracts = new Map<string, Contract>();
  }

  async connect() {
    await this.mongoClient.connect();
  }

  async disconnect() {
    await this.mongoClient.close();
  }

  registerContract(contract: Contract) {
    this.contracts.set(contract.id, contract);
  }
      
  async startStreaming() {
    this.streaming = true;
    this.currentBlockNumber = await this.dbAdapter.getLatestBlockNumber();

    while (this.streaming) {
      const latestBlockNumber = await this.client.database.getDynamicGlobalProperties().then(props => props.head_block_number);

      if (this.currentBlockNumber < latestBlockNumber) {
        await this.processBlock(this.currentBlockNumber + 1);
        this.currentBlockNumber++;
        await this.dbAdapter.updateLatestBlockNumber(this.currentBlockNumber);
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  stopStreaming() {
    this.streaming = false;
  }

  async processBlock(blockNumber: number) {
    const block = await this.client.database.getBlock(blockNumber);
    const transactions = block.transactions;

    for (const transaction of transactions) {
      const customJsonOps = transaction.operations.filter(op => op[0] === "custom_json");
      for (const customJsonOp of customJsonOps) {
        const id = customJsonOp[1].id;
        const json = JSON.parse(customJsonOp[1].json);

        const contract = this.contracts.get(json.hiveContract?.id);
        if (contract) {
          const context = {
            blockNumber: blockNumber,
            blockId: block.block_id,
            previousBlockId: block.previous,
            transactionId: transaction.transaction_id,
            sender: customJsonOp[1].required_posting_auths[0] || customJsonOp[1].required_auths[0],
          };

          await contract.execute(json.hiveContract.payload, context);
          await this.dbAdapter.saveTransaction({ ...context, contract: json.hiveContract });
        }
      }
    }
  }
    
  async saveTransaction(transaction: any) {
    const db = this.mongoClient.db(this.dbName);
    await db.collection("transactions").insertOne(transaction);
  }

  async getLatestBlockNumber() {
    const db = this.mongoClient.db(this.dbName);
    const latestBlock = await db.collection("blocks").findOne({}, { sort: { blockNumber: -1 } });
    return latestBlock ? latestBlock.blockNumber : 0;
  }

  async updateLatestBlockNumber(blockNumber: number) {
    const db = this.mongoClient.db(this.dbName);
    await db.collection("blocks").updateOne({}, { $set: { blockNumber } }, { upsert: true });
  }
}
