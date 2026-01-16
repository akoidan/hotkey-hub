const actionMap = {
  'focusWid': 'focusWindow',
  'keyPress': 'keyPress',
  'typeText': 'typeText',
  'launch': 'launchExe',
  'focusPid': 'focusProcessWindow',
  'setWindowIdBound': 'setWindowBounds',
  'mouseMoveX': 'mouseMoveClick',
  'leftMouseClick': 'leftMouseClick',
  'killByName': 'killExeByName',
  'killByPid': 'killExeByPid',
  'findPidsByName': 'getPidsByName',
  'findProcessWindows': 'getWindowsIdByPid',
  'findProcessesWindows': 'getWindowsIdByPid',
};

const renameMap = {
  'focusWid': 'wid',
  'keyPress': 'key',
  'typeText': 'text',
  'launch': 'path',
  'focusPid': 'pid',
  'setWindowIdBound': 'wid',
  'windowProperties': 'bounds',
  'mouseMoveX': 'x',
  'mouseMoveY': 'y',
  'killByName': 'name',
  'killByPid': 'pid',
  'findPidsByName': 'name',
  'findProcessWindows': 'pid',
  'findProcessesWindows': 'pids',
  'assignId': 'assignVariable',
  'assignIds': 'assignVariable',
  // Others remain the same
};

const baseFields = ['destination', 'delayAfter', 'delayBefore', 'commands'];
const specialFields = ['assignVariable']; // Fields to move to top level instead of variables

function convertCommand(command) {
  if (command.threads) {
    let newComm = {...command}
    newComm.threads = command.threads.map(t => ({
      name: t.name,
      commands: t.commands.map(convertCommand).flat()
    })).flat();
    return newComm;;
  }
  if ((!command.destination || command.variables)) {
    // Local command
    const newCommand = { ...command };
    if (command.commands) {
      newCommand.commands = command.commands.map(convertCommand).flat();
    }
    return [newCommand];
  }

  // Remote or get
  const newCommand = { ...command };
  let performOnRemote = null;
  const variables = {};
  const fields = Object.keys(command).filter(key => !baseFields.includes(key));

  let indicatorField = null;
  for (const field of fields) {
    if (actionMap[field]) {
      indicatorField = field;
      performOnRemote = actionMap[field];
      break;
    }
  }

  if (!performOnRemote) {
    // Unknown, treat as local
    if (command.commands) {
      newCommand.commands = command.commands.map(convertCommand).flat();
    }
    return [newCommand];
  }

  // Special handling for findProcessesWindows
  if (indicatorField === 'findProcessesWindows') {
    const pids = command.findProcessesWindows;
    const assignIds = command.assignIds;
    const newCommands = pids.map((pid, index) => ({
      destination: command.destination,
      delayAfter: command.delayAfter,
      delayBefore: command.delayBefore,
      get: 'getWindowsIdByPid',
      variables: { pid },
      assignVariable: assignIds ? assignIds[index] : undefined
    }));
    return newCommands;
  }

  // Normal conversion
  for (const field of fields) {
    if (specialFields.includes(renameMap[field] || field)) {
      // Move to top level
      newCommand[renameMap[field] || field] = command[field];
    } else {
      const varName = renameMap[field] || field;
      if (varName === 'leftMouseClick') {
        delete newCommand[field];
        continue
      }
      variables[varName] = command[field];
    }
    delete newCommand[field];
  }

  if (performOnRemote.startsWith('get')) {
    newCommand.get = performOnRemote;
  } else {
    newCommand.performOnRemote = performOnRemote;
  }
  if (Object.keys(variables).length > 0) {
    newCommand.variables = variables;
  }

  // Handle nested commands
  if (command.commands) {
    newCommand.commands = command.commands.map(convertCommand).flat();
  }

  return [newCommand];
}

function v1ConfigV2(config) {
  const newConfig = { ...config };
  if (!config.combinations) {
    for (const macroName in newConfig) {
      const macro = newConfig[macroName];
      if (macro.commands) {
        macro.commands = macro.commands.map(convertCommand).flat();
      }
    }
    return newConfig;
  }
  if (newConfig.macros) {
    for (const macroName in newConfig.macros) {
      const macro = newConfig.macros[macroName];
      if (macro.commands) {
        macro.commands = macro.commands.map(convertCommand).flat();
      }
    }
  }

  if (newConfig.combinations) {
    newConfig.combinations = newConfig.combinations.map(combo => {
      if (combo.commands) {
        combo.commands = combo.commands.map(convertCommand).flat();
      }
      return combo;
    });
  }

  return newConfig;
}

const fs = require('fs');

if (require.main === module) {
  const {parse} = require('jsonc-parser');
  const inputPath = 'C:\\Users\\death\\WebstormProjects\\l2\\examples\\config\\tyrs-after-ban.jsonc';
  const outputPath = 'C:\\Users\\death\\WebstormProjects\\l2\\configs\\config.jsonc';
  const oldConfig = parse(fs.readFileSync(inputPath, 'utf8'));
  const newConfig = v1ConfigV2(oldConfig);
  fs.writeFileSync(outputPath, JSON.stringify(newConfig, null, 2));
  console.log('Conversion complete. Output written to', outputPath);
}
