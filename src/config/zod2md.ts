import { convertSchemas, formatModelsAsMarkdown, loadZodSchemas } from 'zod2md';
import { promises as fs } from 'fs';


(async function main() {
  const schemas = await loadZodSchemas({
    entry: 'src/config/types/schema.ts',
    tsconfig: 'tsconfig.json',
  });
  const models = convertSchemas(schemas);
  const order = ['config', 'ips', 'remoteAddress', 'shortcut', 'behaviourObject', 'unknownCommand', 'remoteCommand', 'getInfoRemoteCommand', 'localCommand'];
  models.sort((a, b) => {
    const getOrder = (name: string) => {
      if (name.endsWith('Schema')) {
        const base = name.slice(0, -6);
        const idx = order.indexOf(base);
        if (idx !== -1) return idx;
        if (base === 'globalDelay') {
          return 101;
        }
        if (base === 'rgb'){
          return 102;
        }
        return 100;
      }
      return 100;
    };
    const orderA = getOrder(a.name!);
    const orderB = getOrder(b.name!);
    if (orderA !== orderB) return orderA - orderB;
    return 0;
  });
  const res = formatModelsAsMarkdown(models, {
    title: 'Hotkey HUB',
  });
  await fs.writeFile('./CONFIG.md', res);
})();
