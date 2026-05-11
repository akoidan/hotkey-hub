import {z} from 'zod';
import {macrosListSchema} from '@/config/types/local/macro-local-command';
import {globalDelaySchema} from '@/config/types/delays';
import {shortcutsSchema} from '@/config/types/shortcut';
import {rgbSchema} from '@/config/types/rgb';

const ipsSchema = z.record(z.string(), z.string())
  .describe('Maps PC names to IP addresses or host names. If port is omited default is used' +
    'Example value: {"PC1": "192.168.1.100", "PC2": "domain.name", "PC3: "domain.or.ip:5000"} ' +
    'Each key identifies a remote PC, value is its IP/Domain. The address must be accessible from this PC. ' +
    'For internet access, use VPN or tunneling (e.g. ngrok.com).');


const configSchema = z.object({
  ips: ipsSchema,
  clientPort: z.number()
      .default(5000)
      .optional()
      .describe('HTTPS port for secure client PC connections. ' +
          'Must be accessible and not blocked by firewalls. Default is 5000 if not specified.'),
  rgb: rgbSchema,
  name: z.string()
      .optional()
      .describe('Name of this schema to print in logs'),
  combinations: shortcutsSchema,
  delays: globalDelaySchema,
  macros: macrosListSchema,
}).strict()
    .describe('Root configuration schema that defines the entire setup including remote PCs, shortcuts, RGB settings, and macros. ' +
        'All sections must follow their respective schemas strictly.');

// Generate TypeScript type
type ConfigData = z.infer<typeof configSchema>;
type IpsData = z.infer<typeof ipsSchema>

export type {
  ConfigData,
  IpsData,
};

export {
  configSchema,
  globalDelaySchema,
  ipsSchema,
};
