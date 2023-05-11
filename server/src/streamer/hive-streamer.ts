import { Client } from "@hiveio/dhive";
import { DatabaseAdapter } from "./database/adapter";

export class HiveStreamer {
  private client: Client;
  private dbAdapter: DatabaseAdapter;
  private streaming: boolean;
  private currentBlockNumber: number;

  constructor(client: Client, dbAdapter: DatabaseAdapter) {
    this.client = client;
    this.dbAdapter = dbAdapter;
    this.streaming = false;
    this.currentBlockNumber = 0;
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

        if (json.hiveContract?.id === "testdice") {
          const contractData = {
            blockNumber: blockNumber,
            blockId: block.block_id,
            previousBlockId: block.previous,
            transactionId: transaction.transaction_id,
            sender: customJsonOp[1].required_posting_auths[0] || customJsonOp[1].required_auths[0],
            contract: json.hiveContract
          };

          await this.dbAdapter.saveTransaction(contractData);
        }
      }
    }
  }
}
