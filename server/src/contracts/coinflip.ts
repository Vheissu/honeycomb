import seedrandom from 'seedrandom';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { defineContract, action } from 'hive-stream';
import type { AdapterBase } from 'hive-stream';

function rng(
  previousBlockId: string,
  blockId: string,
  transactionId: string,
  serverSeed: string,
  clientSeed = '',
): 'heads' | 'tails' {
  const seed = `${previousBlockId}${blockId}${transactionId}${clientSeed}${serverSeed}`;
  const roll = Math.floor(seedrandom(seed).double() * 2) + 1;
  return roll === 1 ? 'heads' : 'tails';
}

const flipSchema = z.object({
  guess: z.enum(['heads', 'tails']),
  seed: z.string().optional(),
});

export function createCoinflipContract(name = 'coinflip') {
  let adapter: AdapterBase;

  return defineContract({
    name,
    hooks: {
      create: ({ adapter: a }) => {
        adapter = a;
      },
    },
    actions: {
      flip: action(
        async (payload, ctx) => {
          const serverSeed = uuidv4();
          const result = rng(
            ctx.block.previousId,
            ctx.block.id,
            ctx.transaction.id,
            serverSeed,
            payload.seed,
          );

          const won = result === payload.guess;

          await adapter.addEvent(new Date(), name, 'flip', payload, {
            action: 'coinflip',
            data: {
              guess: payload.guess,
              result,
              won,
              serverSeed,
              previousBlockId: ctx.block.previousId,
              blockId: ctx.block.id,
              transactionId: ctx.transaction.id,
            },
          });

          console.log(
            `[coinflip] ${ctx.sender} guessed ${payload.guess}, result: ${result} — ${won ? 'WIN' : 'LOSS'}`,
          );
        },
        { schema: flipSchema, trigger: 'custom_json' },
      ),
    },
  });
}
