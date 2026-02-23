 interface ConfigCombination {
  shortCut: string;
  name: string;
}

const CONFIG_FILE = 'CONFIGS_DIR';
const CONFIG_PROVIDED = 'CONFIG_PROVIDED';
const VARIABLES_FILE = 'VARIABLES_FILE';
const SAVE_TIMEOUT = 'SAVE_TIMEOUT';

export type {ConfigCombination};

export {CONFIG_FILE, VARIABLES_FILE, CONFIG_PROVIDED, SAVE_TIMEOUT};
