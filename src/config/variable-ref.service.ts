import {Injectable, Logger} from '@nestjs/common';

import {z, ZodArray, ZodEffects, ZodLazy, ZodObject, ZodSchema, ZodTypeAny, ZodUnion} from 'zod';
import {variableValueSchema} from '@/config/types/variables';
import {aARootSchema} from '@/config/types/schema';
import {shortcutsSchema} from '@/config/types/shortcut';
import {macrosListSchema} from '@/config/types/local-commands';

@Injectable()
export class VariableRefService {

  private aaRootSchema: ZodSchema|null = null;
  private aaMacroListSchema: ZodSchema|null = null;

  constructor(
    private readonly logger: Logger,
  ) {
  }


  public getAaRootSchema() {
    if (!this.aaRootSchema) {
      this.aaRootSchema = aARootSchema.extend({
        combinations: this.makeAllFieldsVariableCompatible(shortcutsSchema),
      });
    }
    return this.aaRootSchema;
  }

  public getAaMacroListSchema() {
    if (!this.aaMacroListSchema) {
      this.aaMacroListSchema = this.makeAllFieldsVariableCompatible(macrosListSchema);
    }
    return this.aaMacroListSchema;
  }

  private makeAllFieldsVariableCompatible<T extends ZodTypeAny>(
    schema: T,
    path: string[] = [],
    depth: number = 0,
    seen = new WeakSet<ZodTypeAny>(),
  ): ZodTypeAny {
    // Prevent infinite recursion on circular references
    if (seen.has(schema)) {
      this.logger.debug(`[CIRCULAR] Path: ${path.join('.')}`);
      return schema;
    }
    seen.add(schema);

    const currentPath = [...path, schema.constructor.name];

    // Handle ZodLazy - we need to create a new lazy schema that wraps the processed inner schema
    if (schema instanceof ZodLazy) {
      return z.lazy(() => {
        const innerSchema = schema._def.getter() as ZodTypeAny;
        return this.makeAllFieldsVariableCompatible(innerSchema, [...currentPath, 'lazy'], depth + 1, seen);
      });
    }

    // Handle ZodEffect - we need to preserve the effect while making its inner schema variable-compatible
    if (schema instanceof ZodEffects) {
      const innerSchema = (schema as any)._def.schema as ZodTypeAny;
      if (!innerSchema) {
        return schema;
      }

      // Create a new effect that wraps the processed inner schema
      const processedInner = this.makeAllFieldsVariableCompatible(innerSchema, [...currentPath, 'effect'], depth + 1, seen);

      // Create a new effect that first checks for variable references
      return new ZodEffects({
        ...schema._def,
        schema: processedInner,
        effect: {
          ...schema._def.effect,
          type: 'refinement',
          refinement: (val: any, ctx: any) => {
            // Skip refinement if the value is a variable reference
            if (val && typeof val === 'object' && '$ref' in val) {
              return true;
            }
            // Otherwise, apply the original refinement
            return schema._def.effect.refinement(val, ctx);
          },
        },
      });
    }

    if (schema instanceof ZodObject) {
      const {shape} = schema;
      const newShape: Record<string, ZodTypeAny> = {};

      for (const key in shape) {
        newShape[key] = this.makeAllFieldsVariableCompatible(shape[key], [...currentPath, key], depth + 1, seen);
      }

      return z.object(newShape);
    }

    if (schema instanceof ZodArray) {
      return z
        .array(this.makeAllFieldsVariableCompatible(schema.element, [...currentPath, '[]'], depth + 1, seen))
        .or(variableValueSchema);
    }

    if (schema instanceof ZodUnion) {
      const options = (schema._def as any).options as ZodTypeAny[];
      const newOptions = options.map((opt, i) =>
        this.makeAllFieldsVariableCompatible(opt, [...currentPath, `union_${i}`], depth + 1, seen));
      // @ts-ignore
      return z.union([...newOptions, variableValueSchema]);
    }

    // Base case: wrap any leaf type with union($ref) but only if it's not already variable-compatible

    // Check if the schema is already variable-compatible
    if (schema instanceof ZodUnion &&
      schema._def.options.some((opt: any) => opt === variableValueSchema)) {
      return schema;
    }

    // Create a new schema that first checks for variable references
    return z.union([
      schema,
      variableValueSchema.refine(
        (val) => {
          if (val && typeof val === 'object' && '$ref' in val) {
            return true;
          }
          return schema.safeParse(val).success;
        },
        {message: 'Value does not match schema'}
      ),
    ]);
  }
}
