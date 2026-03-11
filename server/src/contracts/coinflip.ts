import { createHash, randomUUID } from 'node:crypto';
import { z } from 'zod';
import { defineContract, action } from 'hive-stream';
import type { AdapterBase } from 'hive-stream';

/**
 * Derives a deterministic coin-flip result from block data + server/client seeds.
 * Every node replaying the same block arrives at the same outcome.
 */
function rng(
  previousBlockId: string,
  blockId: string,
  transactionId: string,
  serverSeed: string,
  clientSeed = '',
): 'heads' | 'tails' {
  const hash = createHash('sha256')
    .update(`${previousBlockId}${blockId}${transactionId}${clientSeed}${serverSeed}`)
    .digest();
  // Use the first 4 bytes as a uint32, map to 1 or 2
  const roll = (hash.readUInt32BE(0) % 2) + 1;
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
          const serverSeed = randomUUID();
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
            `[${name}] ${ctx.sender} guessed ${payload.guess}, result: ${result} — ${won ? 'WIN' : 'LOSS'}`,
          );
        },
        { schema: flipSchema, trigger: 'custom_json' },
      ),
    },
  });
}
