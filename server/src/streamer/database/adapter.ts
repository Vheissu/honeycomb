export interface DatabaseAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  saveTransaction(transaction: any): Promise<void>;
  getLatestBlockNumber(): Promise<number>;
  updateLatestBlockNumber(blockNumber: number): Promise<void>;
  createTable(tableName: string, schema: string): Promise<void>;
  updateTable(tableName: string, data: any, condition: any): Promise<void>;
}
