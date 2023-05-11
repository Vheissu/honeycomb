import sqlite3 from "sqlite3";
import { DatabaseAdapter } from "./adapter";

export class SQLiteAdapter implements DatabaseAdapter {
  private db: sqlite3.Database;

  constructor(filename: string) {
    this.db = new sqlite3.Database(filename);
  }

  async connect() {
    return new Promise<void>((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run(`
          CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            blockNumber INTEGER,
            blockId TEXT,
            previousBlockId TEXT,
            transactionId TEXT,
            sender TEXT,
            contract TEXT
          );
        `);
        this.db.run(`
          CREATE TABLE IF NOT EXISTS blocks (
            id INTEGER PRIMARY KEY,
            blockNumber INTEGER
          );
        `, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });
  }

  async disconnect() {
    return new Promise<void>((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async saveTransaction(transaction: any) {
    return new Promise<void>((resolve, reject) => {
      this.db.run(`
        INSERT INTO transactions (blockNumber, blockId, previousBlockId, transactionId, sender, contract)
        VALUES (?, ?, ?, ?, ?, ?);
      `, [transaction.blockNumber, transaction.blockId, transaction.previousBlockId, transaction.transactionId, transaction.sender, JSON.stringify(transaction.contract)], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async getLatestBlockNumber() {
    return new Promise<number>((resolve, reject) => {
      this.db.get("SELECT blockNumber FROM blocks ORDER BY blockNumber DESC LIMIT 1;", (err, row) => {
        if (err) reject(err);
        else resolve(row ? row.blockNumber : 0);
      });
    });
  }

  async updateLatestBlockNumber(blockNumber: number) {
    return new Promise<void>((resolve, reject) => {
      this.db.run("INSERT OR REPLACE INTO blocks (id, blockNumber) VALUES (1, ?);", [blockNumber], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
      
async createTable(tableName: string, schema: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    this.db.run(`CREATE TABLE IF NOT EXISTS ${tableName} (${schema});`, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

async updateTable(tableName: string, data: any, condition: any): Promise<void> {
  const setClause = Object.entries(data).map(([key, value]) => `${key} = ?`).join(', ');
  const whereClause = Object.entries(condition).map(([key, value]) => `${key} = ?`).join(' AND ');

  const query = `UPDATE ${tableName} SET ${setClause} WHERE ${whereClause};`;
  const values = [...Object.values(data), ...Object.values(condition)];

  return new Promise<void>((resolve, reject) => {
    this.db.run(query, values, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}
}
