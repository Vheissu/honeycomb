import { Contract } from "./contract";

export class CoinflipContract implements Contract {
  id = "coinflip";
  name = "Coinflip";

  async execute(payload: any, context: any): Promise<void> {
    const randomNumber = Math.floor(Math.random() * 100) + 1;
    const result = randomNumber > 50 ? "heads" : "tails";

    console.log(`Coinflip result: ${result}`);
    console.log(`Payload:`, payload);
    console.log(`Context:`, context);
  }
}
