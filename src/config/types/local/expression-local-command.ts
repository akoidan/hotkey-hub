import {z} from 'zod';

const expressionSchema = z.string().superRefine((expr, ctx) => {
  try {
    // eslint-disable-next-line
    new Function(`return (${expr});`);
  } catch (e) {
    ctx.addIssue({
      code: 'custom',
      path: [],
      message: `"${expr}" is not a valid expression, because of ${e?.message ?? e}`,
    });
  }
}).describe('JS like expression that evaluates to some values. E.g. x*2.')

const expressionLocalCommandSchema = z.object({
  assignVariable: z.string().describe('Name of the variable to store the expression result. ' +
    'This variable can be referenced in subsequent commands using {{variableName}} syntax.'),
  expression: expressionSchema,
}).strict()
  .describe('Allows to create/assign a variable by expression.');

type ExpressionLocalCommand = z.infer<typeof expressionLocalCommandSchema>;
type Expression = z.infer<typeof expressionSchema>;

export {
  expressionSchema,
  expressionLocalCommandSchema,
};

export type {
  Expression,
  ExpressionLocalCommand,
};
