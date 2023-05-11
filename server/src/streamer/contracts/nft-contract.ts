import { Contract } from "./contract";
import { DatabaseAdapter } from "./adapter";
import { TableSchema } from "../database/table-schema";

export class NFTContract implements Contract {
  id = "nft";
  name = "NFT";

  private nftTableSchema: TableSchema = {
    tableName: "nfts",
    columns: [
      { name: "id", type: "TEXT", primaryKey: true },
      { name: "owner", type: "TEXT" },
      { name: "data", type: "TEXT" },
    ],
  };

  constructor(private dbAdapter: DatabaseAdapter) {
    this.initialize();
  }

  async initialize() {
    await this.dbAdapter.createTable(this.nftTableSchema);
  }

  // ... rest of the NFTContract class
}
