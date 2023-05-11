export interface DatabaseAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  saveTransaction(transaction: any): Promise<void>;
  getLatestBlockNumber(): Promise<number>;
  updateLatestBlockNumber(blockNumber: number): Promise<void>;
}
