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

    async execute(payload: any, context: any): Promise<void> {
        const { action, nftId, data } = payload;

        switch (action) {
          case "create":
            await this.createNFT(nftId, context.sender, data);
            break;
          case "update":
            await this.updateNFT(nftId, data, context.sender);
            break;
          default:
            console.error("Invalid action for NFT contract");
        }
    }

    async createNFT(nftId: string, owner: string, data: any) {
        await this.dbAdapter.updateTable("nfts", { id: nftId, owner, data: JSON.stringify(data) }, { id: nftId });
    }

    async updateNFT(nftId: string, data: any, sender: string) {
        await this.dbAdapter.updateTable("nfts", { data: JSON.stringify(data) }, { id: nftId, owner: sender });
    }
}
