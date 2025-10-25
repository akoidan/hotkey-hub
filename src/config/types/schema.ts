/* eslint-disable max-lines*/
import {z, ZodArray, ZodEffects, ZodLazy, ZodObject, ZodTypeAny, ZodUnion} from 'zod';


import {variablesSchema, variableValueSchema} from '@/config/types/variables';
import {shortcutSchema, shortcutsSchema} from '@/config/types/shortcut';
import {globalDelaySchema} from '@/config/types/delays';
import {
  findPidsByNameRemoteCommandSchema,
  findProcessesWindowsRemoteCommandSchema,
  findProcessWindowsRemoteCommandSchema,
  focusProcessWindowRemoteCommandSchema,
  focusWindowRemoteCommandSchema,
  keyPressRemoteCommandSchema,
  keySchema,
  killExeByNameRemoteCommandSchema,
  killExeByPidRemoteCommandSchema,
  launchExeRemoteCommandSchema,
  leftMouseClickRemoteCommandSchema,
  mouseMoveClickRemoteCommandSchema,
  remoteCommandSchema,
  typeTextRemoteCommandSchema,
} from '@/config/types/remote-commands';
import {
  expressionLocalCommandSchema,
  loopLocalCommandSchema,
  macroDefinitionSchema,
  macroLocalCommandSchema,
  reloadConfigLocalCommandSchema,
  macrosListSchema,
  macroVariablesDescriptionSchema,
  threadLocalArraySchema,
  threadsLocalCommandSchema,
  transactionLocalCommandSchema,
  unknownCommandSchema,
} from '@/config/types/local-commands';

const ipsSchema = z.record(z.string().ip())
  .describe('Maps PC names to IP addresses. Each key identifies a remote PC, value is its IP. IP must be accessible from remote PC. ' +
    'For internet access, use VPN or tunneling (e.g. ngrok.com).');

const rgbSchema = z.object({
  deviceName: z.string().describe('Device name of the keyboard. ' +
    'You can extract it with "openrgb --list-devices" command. Select the name after number'),
  clientName: z.string().default('RPC').describe('Name of this client when connecting to openrg').optional(),
  serverPort: z.number().default(6742).describe('Port of the openrgb server').optional(),
  serverAddr: z.string().default('localhost').describe('Address of the openrgb server').optional(),
  keyMapFn: z.string()
    .default('x.toLowerCase().replace(\' arrow\', \'\').replace(\'key: \', \'\').replace(\' (ansi)\', \'\').replace(\' \', \'_\')')
    .describe('Mapping of keyboard api key name to default map key names. ' +
      'This should be a JS expression that accept variable "x" and evaluates to a string')
    .optional(),
}).strict().optional()
  .describe('RGB keyboard lighting for shortcut feedback. Changes key colors during execution.' +
    ' Needs OpenRGB server and compatible keyboard. See https://openrgb.org/.');

const aATypeRootSchema = z.object({
  ips: ipsSchema,
  clientPort: z.number()
    .optional()
    .default(5000)
    .describe('HTTPS port for secure client PC connections. ' +
      'Must be accessible and not blocked by firewalls. Default is 5000 if not specified.'),
  rgb: rgbSchema,
  combinations: shortcutsSchema,
  delays: globalDelaySchema,
  macros: macrosListSchema,
}).strict()
  .describe('Root configuration schema that defines the entire setup including remote PCs, shortcuts, RGB settings, and macros. ' +
    'All sections must follow their respective schemas strictly.');


function makeAllFieldsVariableCompatible<T extends ZodTypeAny>(
  schema: T,
  path: string[] = [],
  depth: number = 0,
  seen: WeakSet<ZodTypeAny> = new WeakSet()
): ZodTypeAny {
  // Prevent infinite recursion on circular references
  if (seen.has(schema)) {
    console.log(`[CIRCULAR] Path: ${path.join('.')}`);
    return schema;
  }
  seen.add(schema);
  
  const currentPath = [...path, schema.constructor.name];
  console.log(`[DEPTH ${depth}] Processing ${currentPath.join(' -> ')}`);
  
  try {
    // Handle ZodLazy - we need to create a new lazy schema that wraps the processed inner schema
    if (schema instanceof ZodLazy) {
      console.log(`[LAZY] Creating wrapped lazy schema at path: ${currentPath.join('.')}`);
      return z.lazy(() => {
        const innerSchema = schema._def.getter() as ZodTypeAny;
        return makeAllFieldsVariableCompatible(innerSchema, [...currentPath, 'lazy'], depth + 1, seen);
      });
    }
    
    // Handle ZodEffect - we need to preserve the effect while making its inner schema variable-compatible
    if (schema instanceof ZodEffects) {
      console.log(`[EFFECT] Creating wrapped effect schema at path: ${currentPath.join('.')}`);
      const innerSchema = (schema as any)._def.schema as ZodTypeAny;
      if (!innerSchema) {
        return schema;
      }
      
      // Create a new effect that wraps the processed inner schema
      const processedInner = makeAllFieldsVariableCompatible(innerSchema, [...currentPath, 'effect'], depth + 1, seen);
      
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
          }
        }
      });
    }

    if (schema instanceof ZodObject) {
      console.log(`[OBJECT] Processing object with keys: ${Object.keys(schema.shape).join(', ')}`);
      const shape = schema.shape;
      const newShape: Record<string, ZodTypeAny> = {};

      for (const key in shape) {
        console.log(`[OBJECT] Processing key: ${key}`);
        newShape[key] = makeAllFieldsVariableCompatible(shape[key], [...currentPath, key], depth + 1, seen);
      }

    return z.object(newShape);
  }

    if (schema instanceof ZodArray) {
      console.log(`[ARRAY] Processing array element at path: ${currentPath.join('.')}`);
      return z
        .array(makeAllFieldsVariableCompatible(schema.element, [...currentPath, '[]'], depth + 1, seen))
        .or(variableValueSchema);
    }

    if (schema instanceof ZodUnion) {
      const options = (schema._def as any).options as ZodTypeAny[];
      console.log(`[UNION] Processing ${options.length} union options at path: ${currentPath.join('.')}`);
      const newOptions = options.map((opt, i) => 
        makeAllFieldsVariableCompatible(opt, [...currentPath, `union_${i}`], depth + 1, seen)
      );
      // @ts-ignore
      return z.union([...newOptions, variableValueSchema]);
    }

    // Base case: wrap any leaf type with union($ref) but only if it's not already variable-compatible
    console.log(`[LEAF] Wrapping leaf type at path: ${currentPath.join('.')} (${schema.constructor.name})`);
    
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
        { message: 'Value does not match schema' }
      )
    ]);
  } catch (error) {
    console.error(`Error processing schema at path ${currentPath.join('.')}:`, error);
    throw error;
  }
}

const aARootSchema = aATypeRootSchema.extend({
  combinations: makeAllFieldsVariableCompatible(shortcutsSchema),
});

// Generate TypeScript type
type ConfigData = z.infer<typeof aATypeRootSchema>;
type ConfigDataWoMacro = Omit<ConfigData, 'macros'>;

type IpsData = z.infer<typeof ipsSchema>
type RgbData = z.infer<typeof rgbSchema>


export type {
  ConfigDataWoMacro,
  ConfigData,
  IpsData,
  RgbData,
};

export {
  rgbSchema,
  aARootSchema,
  globalDelaySchema,
  ipsSchema,
  shortcutSchema,
  shortcutsSchema,
  loopLocalCommandSchema,
  variablesSchema,
  keyPressRemoteCommandSchema,
  leftMouseClickRemoteCommandSchema,
  mouseMoveClickRemoteCommandSchema,
  launchExeRemoteCommandSchema,
  focusProcessWindowRemoteCommandSchema,
  focusWindowRemoteCommandSchema,
  typeTextRemoteCommandSchema,
  killExeByPidRemoteCommandSchema,
  killExeByNameRemoteCommandSchema,
  findPidsByNameRemoteCommandSchema,
  findProcessWindowsRemoteCommandSchema,
  findProcessesWindowsRemoteCommandSchema,
  remoteCommandSchema,
  keySchema,
  threadsLocalCommandSchema,
  macroLocalCommandSchema,
  unknownCommandSchema,
  expressionLocalCommandSchema,
  threadLocalArraySchema,
  transactionLocalCommandSchema,
  macroVariablesDescriptionSchema,
  macroDefinitionSchema,
  macrosListSchema,
  reloadConfigLocalCommandSchema,
};
