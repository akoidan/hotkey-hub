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

  const localCommands = models.filter(m => m.name?.includes('LocalCommand'));
  const remoteCommands = models.filter(m => m.name?.includes('RemoteCommand'));
  const getCommands = models.filter(m => m.name?.toLowerCase().startsWith('get'));

  const orderedBases = order;
  const orderedModels = models.filter(m => {
    const name = m.name;
    if (name && name.endsWith('Schema')) {
      const base = name.slice(0, -6);
      return orderedBases.includes(base);
    }
    return false;
  });
  const unionNames = ['remoteCommandSchema', 'localCommandSchema', 'getInfoCommandSchema'];
  const orderedModelsFiltered = orderedModels.filter(m => !unionNames.includes(m.name!));
  const commandModels = models.filter(m => !orderedModels.includes(m));
  const remainingCommands = commandModels.filter(m => !localCommands.includes(m) && !remoteCommands.includes(m) && !getCommands.includes(m));

  const remoteCommandModel = models.find(m => m.name === 'remoteCommandSchema');
  const localCommandModel = models.find(m => m.name === 'localCommandSchema');
  const getInfoRemoteCommandModel = models.find(m => m.name === 'getInfoCommandSchema');

  const remoteCommandMd = remoteCommandModel ? formatModelsAsMarkdown([remoteCommandModel], { title: '' }).replace(/^# \n\n/, '') : '';
  const localCommandMd = localCommandModel ? formatModelsAsMarkdown([localCommandModel], { title: '' }).replace(/^# \n\n/, '') : '';
  const getInfoCommandMd = getInfoRemoteCommandModel ? formatModelsAsMarkdown([getInfoRemoteCommandModel], { title: '' }).replace(/^# \n\n/, '') : '';

  const orderedMd = formatModelsAsMarkdown(orderedModelsFiltered, { title: '' }).replace(/^# \n\n/, '');
  const localMd = (localCommandMd ? localCommandMd + '\n\n' : '') + formatModelsAsMarkdown(localCommands, { title: '' }).replace(/^# \n\n/, '');
  const remoteMd = (remoteCommandMd ? remoteCommandMd + '\n\n' : '') + formatModelsAsMarkdown(remoteCommands, { title: '' }).replace(/^# \n\n/, '');
  const getMd = (getInfoCommandMd ? getInfoCommandMd + '\n\n' : '') + formatModelsAsMarkdown(getCommands, { title: '' }).replace(/^# \n\n/, '');
  const remainingMd = formatModelsAsMarkdown(remainingCommands, { title: '' }).replace(/^# \n\n/, '');

  const res = orderedMd + '\n\n' + `# LocalCommands\n\n${localMd}\n\n# RemoteCommands\n\n${remoteMd}\n\n# Get Commands\n\n${getMd}` + (remainingMd ? '\n\n' + remainingMd : '');

  await fs.writeFile('./CONFIG.md', res);
})();
