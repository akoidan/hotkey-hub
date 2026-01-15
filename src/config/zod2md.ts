import {convertSchemas, formatModelsAsMarkdown, loadZodSchemas, NamedModel} from 'zod2md';
import {promises as fs} from 'fs';
import {rethrow} from '@nestjs/core/helpers/rethrow';


(async function main() {
  const schemas = await loadZodSchemas({
    entry: 'src/config/types/schema.ts',
    tsconfig: 'tsconfig.json',
  });
  const models = convertSchemas(schemas);

  const seen = new Set<string>();


  function markAllModelsSubmited(models: NamedModel[]) {
    for (let model of models) {
      if (seen.has(model.name!)) {
        throw new Error("IVALID")
      }
      seen.add(model.name!);;
    }
  }

  let order = ['config', 'ips',  'shortcut', 'unknownCommand'];

  function noremalizeName(name: string|undefined) {
    if (!name) {
      throw new Error(`Undefined name`);
    }
    if (!name.endsWith('Schema')) {
      throw new Error(`name ${name} doesnt end with schema`);
    }
    return name.slice(0, -6)
  }
  const orderedModels = models
    .filter(m => order.includes(noremalizeName(m.name)))
    .sort((a, b) => order.indexOf(noremalizeName(a.name)) - order.indexOf(noremalizeName(b.name)));
  let headMD = formatModelsAsMarkdown(orderedModels, {title: 'Hotkey HUB'});
  markAllModelsSubmited(orderedModels);

  function formatCommandSectionMd(name: string, individualFilter: (name: string) => boolean, extra?: NamedModel): [string, string] {
    const commandModel = models.find(m => m.name === name)!;
    const optionNames = (commandModel as any)?.options?.map((o: any) => o.ref.name) || [];
    let groupsOfCommands = models.filter(m => optionNames.includes(m.name!));
    let commands = models.filter(m => individualFilter(m.name!) && !optionNames.includes(m.name!) && m !== commandModel);
    if (commands.length === 0) {
      commands = groupsOfCommands;
      groupsOfCommands = [commandModel];
    } else {
      groupsOfCommands.unshift(commandModel!)
    }
    markAllModelsSubmited(groupsOfCommands);
    markAllModelsSubmited(commands);
    let a = '';
    let b = '';

    if (groupsOfCommands.length > 0) {
      a = formatModelsAsMarkdown(groupsOfCommands, {title: ''}).replace(/^# \n\n/, '');
    }
    if (commands.length > 0) {
      b = formatModelsAsMarkdown(commands, {title: ''}).replace(/^# \n\n/, '');
    }
    return [a,b];
  }

  const [r1, r2] = formatCommandSectionMd('remoteCommandSchema', name => name.includes('RemoteCommand'));
  const [l1, l2] = formatCommandSectionMd( 'localCommandSchema', name => name.includes('LocalCommand'));
  const [g1, g2]= formatCommandSectionMd('getInfoCommandSchema', name => name.toLowerCase().startsWith('get'));


  const remaining = models.filter(m => !seen.has(m.name!));
  let helpers = formatModelsAsMarkdown(remaining, {title: 'Helpers'});

  const res = `${headMD}\n${r1}\n${l1}\n${g1}\n${r2}\n${l2}\n${g2}\n${helpers}`;

  await fs.writeFile('./CONFIG.md', res);
})();
