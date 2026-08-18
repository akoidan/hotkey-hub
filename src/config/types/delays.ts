import {z} from 'zod';

const globalDelaySchema = z.object({
  beforeCommand: z.number()
    .default(0)
    .describe('Base delay (in milliseconds) before each command. Can be randomized using standardDeviation.')
    .optional(),

  httpRequest: z.number()
    .default(6000)
    .describe('Timeout (in milliseconds) for HTTP request. If timeout is exceeded, request will fail and command will be terminated.')
    .optional(),

  httpRequestInit: z.number()
    .default(3000)
    .describe('Timeout (in milliseconds) for the first request to check all clients')
    .optional(),

  afterCommand: z.number()
    .default(0)
    .describe('Base delay (in milliseconds) after each command. Can be randomized using standardDeviation.')
    .optional(),

  standardDeviation: z.number()
    .positive()
    .max(1)
    .default(0)
    .describe('Controls randomness of global before/after delays.'
      + 'Final delay = base ± (base * standardDeviation). '
      + 'E.g. 0.2 with 1000ms delay gives random delay between 800ms and 1200ms.')
    .optional(),

  commandDeviation: z.number()
    .positive()
    .max(1)
    .default(0)
    .describe('Controls randomness of delays before/after on each command. ' +
      'This doesn\'t affect global delays, only if a command has its own delayBefore or delayAfter property.'
      + 'Final delay = base ± (base * standardDeviation). '
      + 'E.g. 0.2 with 1000ms delay gives random delay between 800ms and 1200ms.')
    .optional(),

  randomHugeDelayDeviation: z.number()
    .positive()
    .max(1)
    .default(0)
    .describe('Deviation factor for huge delay. Applied only when randomHugeDelayChance is triggered. '
      + 'Final delay = base ± (base * standardDeviation) + (hugeDelay ± (hugeDelay * randomHugeDelayDiviation)).')
    .optional(),

  randomHugeDelay: z.number()
    .positive()
    .default(0)
    .describe('Extra delay (in milliseconds) added on top of standard delays. '
      + 'Only applies when randomHugeDelayChance is triggered.')
    .optional(),

  randomHugeDelayChance: z.number()
    .positive()
    .max(1)
    .default(0)
    .describe('Probability (0 to 1) of applying a random huge delay after the standard delay.')
    .optional(),
})
  .strict()
  .optional()
  .describe('Global delays config between commands. If ommited commands will run instantly after each other');

type DelayData = z.infer<typeof globalDelaySchema>

export {globalDelaySchema};
export type {DelayData};
