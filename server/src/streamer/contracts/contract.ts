export interface Contract {
  id: string;
  name: string;
  execute(payload: any, context: any): Promise<void>;
}
