import { Contract } from "./contract";
import { MongoClient } from "mongodb";

export class NftContract implements Contract {
    id = "nft";
    name = "NFT";
    private mongoClient: MongoClient;
    private dbName: string;

    constructor(mongoClient: MongoClient, dbName: string) {
        this.mongoClient = mongoClient;
        this.dbName = dbName;
    }

    async createTable() {
        const db = this.mongoClient.db(this.dbName);
        await db.createCollection("nfts");
    }

    async execute(payload: any, context: any): Promise<void> {
        const db = this.mongoClient.db(this.dbName);
        const nfts = db.collection("nfts");

        switch (payload.action) {
          case "create":
            const {
              name,
              orgName,
              productName,
              symbol,
              url,
              maxSupply,
              authorizedIssuingAccounts,
              authorizedIssuingContracts,
            } = payload;

            await nfts.insertOne({
              issuer: context.sender,
              symbol,
              name,
              orgName: orgName || "",
              productName: productName || "",
              metadata: { url: url || "" },
              maxSupply: maxSupply || 0,
              supply: 0,
              circulatingSupply: 0,
              delegationEnabled: false,
              undelegationCooldown: 0,
              authorizedIssuingAccounts: authorizedIssuingAccounts || [context.sender],
              authorizedIssuingContracts: authorizedIssuingContracts || [],
              properties: {},
              groupBy: [],
            });

            console.log(`NFT created: symbol=${symbol}`);
            break;

          case "transfer":
            await nfts.updateOne(
              { tokenId: payload.tokenId, owner: context.sender },
              { $set: { owner: payload.newOwner } }
            );
            console.log(`NFT transferred: tokenId=${payload.tokenId} newOwner=${payload.newOwner}`);
            break;

          default:
            console.log(`Invalid NFT action: ${payload.action}`);
        }
    }
      
    async issue(payload: any, context: any): Promise<void> {
        const db = this.mongoClient.db(this.dbName);
        const nfts = db.collection("nfts");
        const transactions = db.collection("transactions");

        const { tokenId, metadata, owner } = payload;

        // Check if tokenId is unique
        const existingToken = await nfts.findOne({ tokenId });
        if (existingToken) {
        console.log(`Token ID ${tokenId} already exists.`);
        return;
        }

        // Check if the transaction has already been processed
        const existingTransaction = await transactions.findOne({ transactionId: context.transactionId });
        if (existingTransaction) {
        console.log(`Transaction ${context.transactionId} has already been processed.`);
        return;
        }

        // Issue the NFT
        await nfts.insertOne({
        tokenId,
        owner,
        metadata,
        });

        console.log(`NFT issued: tokenId=${tokenId} owner=${owner}`);
    }
}
