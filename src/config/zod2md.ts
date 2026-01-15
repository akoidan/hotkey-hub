import {convertSchemas, formatModelsAsMarkdown, loadZodSchemas, type NamedModel, type Ref} from 'zod2md';
import {promises as fs} from 'fs';
import type {ZodUnion} from 'zod/src/v4/classic/schemas';

const order = ['config', 'ips', 'shortcut', 'unknownCommand'];
const seen = new Set<string>();
const resultModels: NamedModel[] = [];
let allModels: NamedModel[] = [];


function markSeen(passedModel: NamedModel[]): void {
  for (const model of passedModel) {
    seen.add(model.name!);
  }
}


function normalizeName(name: string | undefined): string {
  if (!name) {
    throw new Error('Undefined name');
  }
  if (!name.endsWith('Schema')) {
    throw new Error(`name ${name} doesnt end with schema`);
  }
  return name.slice(0, -6);
}


function processSection(name: string, individualFilter: (name: string) => boolean): void {
  const commandModel = allModels.find(m => m.name === name)!;
  const optionNames = (commandModel as any as ZodUnion)!.options!.map((o: unknown) => (o as {
    kind: 'ref';
    ref: Ref;
  }).ref.name) || [];
  let groupsOfCommands = allModels.filter(m => optionNames.includes(m.name!));
  let commands = allModels.filter(m => individualFilter(m.name!) && !optionNames.includes(m.name!) && m !== commandModel);
  if (commands.length === 0) {
    commands = groupsOfCommands;
    groupsOfCommands = [commandModel];
  } else {
    groupsOfCommands.unshift(commandModel!);
  }
  // Filter out already seen
  groupsOfCommands = groupsOfCommands.filter(m => !seen.has(m.name!));
  commands = commands.filter(m => !seen.has(m.name!));
  resultModels.push(...groupsOfCommands, ...commands);
  markSeen(groupsOfCommands);
  markSeen(commands);
}


void (async function main(): Promise<void> {
  const schemas = await loadZodSchemas({
    entry: 'src/config/types/schema.ts',
    tsconfig: 'tsconfig.json',
  });
  allModels = convertSchemas(schemas);

  const orderedModels = allModels
    .filter(m => order.includes(normalizeName(m.name)))
    .sort((a, b) => order.indexOf(normalizeName(a.name)) - order.indexOf(normalizeName(b.name)));

  resultModels.push(...orderedModels);
  markSeen(orderedModels);

  processSection('remoteCommandSchema', name => name.includes('RemoteCommand'));
  processSection('localCommandSchema', name => name.includes('LocalCommand'));
  processSection('getInfoCommandSchema', name => name.toLowerCase().startsWith('get'));

  const remaining = allModels.filter(m => !seen.has(m.name!));
  resultModels.push(...remaining);

  const md = formatModelsAsMarkdown(resultModels, {title: 'Hotkey HUB'});

  await fs.writeFile('./CONFIG.md', md);
})();
