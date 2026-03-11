import { z } from 'zod';
import { defineContract, action } from 'hive-stream';
import type { AdapterBase } from 'hive-stream';

const createSchema = z.object({
  symbol: z.string().regex(/^[A-Z0-9]{1,20}$/, 'Symbol must be 1-20 uppercase alphanumeric characters'),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  maxSupply: z.number().int().min(1).max(1_000_000).optional(),
  royalty: z.number().min(0).max(0.25).optional(),
  baseUri: z.string().max(500).optional(),
});

const issueSchema = z.object({
  collectionSymbol: z.string().min(1),
  tokenId: z.string().regex(/^[A-Za-z0-9_-]{1,50}$/, 'Token ID must be 1-50 alphanumeric characters'),
  to: z.string().min(1),
  metadata: z.string().max(2000).optional(),
});

const transferSchema = z.object({
  collectionSymbol: z.string().min(1),
  tokenId: z.string().min(1),
  to: z.string().min(1),
});

async function initTables(adapter: AdapterBase) {
  await adapter.query(`
    CREATE TABLE IF NOT EXISTS nft_collections (
      symbol TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      creator TEXT NOT NULL,
      max_supply INTEGER,
      current_supply INTEGER NOT NULL DEFAULT 0,
      royalty REAL DEFAULT 0,
      base_uri TEXT,
      created_at DATETIME NOT NULL
    )
  `);

  await adapter.query(`
    CREATE TABLE IF NOT EXISTS nft_tokens (
      token_id TEXT NOT NULL,
      collection_symbol TEXT NOT NULL,
      owner TEXT NOT NULL,
      metadata TEXT,
      minted_at DATETIME NOT NULL,
      minted_by TEXT NOT NULL,
      PRIMARY KEY (token_id, collection_symbol),
      FOREIGN KEY (collection_symbol) REFERENCES nft_collections(symbol)
    )
  `);

  await adapter.query(
    'CREATE INDEX IF NOT EXISTS idx_nft_tokens_owner ON nft_tokens(owner)'
  );
}

export function createNftContract(contractName = 'nft') {
  let adapter: AdapterBase;

  return defineContract({
    name: contractName,
    hooks: {
      create: async ({ adapter: a }) => {
        adapter = a;
        if (!adapter.capabilities?.sql) {
          throw new Error('NFT contract requires a SQL-capable adapter (SQLite or PostgreSQL).');
        }
        await initTables(adapter);
      },
    },
    actions: {
      create: action(
        async (payload, ctx) => {
          const { symbol, name, description = '', maxSupply, royalty = 0, baseUri = '' } = payload;

          const existing = await adapter.query(
            'SELECT symbol FROM nft_collections WHERE symbol = ?',
            [symbol],
          );

          if (existing?.length) {
            throw new Error(`Collection ${symbol} already exists`);
          }

          await adapter.query(
            `INSERT INTO nft_collections (symbol, name, description, creator, max_supply, royalty, base_uri, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [symbol, name, description, ctx.sender, maxSupply ?? null, royalty, baseUri, new Date()],
          );

          await adapter.addEvent(new Date(), contractName, 'create', payload, {
            action: 'collection_created',
            data: { symbol, name, creator: ctx.sender },
          });

          console.log(`[${contractName}] Collection ${symbol} created by ${ctx.sender}`);
        },
        { schema: createSchema, trigger: 'custom_json' },
      ),

      issue: action(
        async (payload, ctx) => {
          const { collectionSymbol, tokenId, to, metadata = '' } = payload;

          const collection = await adapter.query(
            'SELECT * FROM nft_collections WHERE symbol = ?',
            [collectionSymbol],
          );

          if (!collection?.length) {
            throw new Error(`Collection ${collectionSymbol} does not exist`);
          }

          if (collection[0].creator !== ctx.sender) {
            throw new Error('Only the collection creator can issue NFTs');
          }

          if (collection[0].max_supply && collection[0].current_supply >= collection[0].max_supply) {
            throw new Error('Collection has reached maximum supply');
          }

          await adapter.query(
            `INSERT INTO nft_tokens (token_id, collection_symbol, owner, metadata, minted_at, minted_by)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [tokenId, collectionSymbol, to, metadata, new Date(), ctx.sender],
          );

          await adapter.query(
            'UPDATE nft_collections SET current_supply = current_supply + 1 WHERE symbol = ?',
            [collectionSymbol],
          );

          await adapter.addEvent(new Date(), contractName, 'issue', payload, {
            action: 'nft_issued',
            data: { tokenId, collectionSymbol, to, mintedBy: ctx.sender },
          });

          console.log(`[${contractName}] Token ${tokenId} issued to ${to} in ${collectionSymbol}`);
        },
        { schema: issueSchema, trigger: 'custom_json' },
      ),

      transfer: action(
        async (payload, ctx) => {
          const { collectionSymbol, tokenId, to } = payload;

          const token = await adapter.query(
            'SELECT * FROM nft_tokens WHERE token_id = ? AND collection_symbol = ?',
            [tokenId, collectionSymbol],
          );

          if (!token?.length) {
            throw new Error(`Token ${tokenId} does not exist`);
          }

          if (token[0].owner !== ctx.sender) {
            throw new Error('Only the token owner can transfer');
          }

          await adapter.query(
            'UPDATE nft_tokens SET owner = ? WHERE token_id = ? AND collection_symbol = ?',
            [to, tokenId, collectionSymbol],
          );

          await adapter.addEvent(new Date(), contractName, 'transfer', payload, {
            action: 'nft_transferred',
            data: { tokenId, collectionSymbol, from: ctx.sender, to },
          });

          console.log(`[${contractName}] Token ${tokenId} transferred from ${ctx.sender} to ${to}`);
        },
        { schema: transferSchema, trigger: 'custom_json' },
      ),
    },
  });
}
