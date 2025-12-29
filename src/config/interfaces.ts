import type {IpsData, RgbData} from '@/config/types/schema';
import type {Shortcut} from '@/config/types/shortcut';
import type {Variables} from '@/config/types/variables';
import type {DelayData} from '@/config/types/delays';
import type {MacroList} from '@/config/types/local-commands';

export interface ConfigProvider {
  getIps(): IpsData;

  getOpenRgb(): RgbData;

  getCombinations(): Shortcut[];

  getMacros(): NonNullable<MacroList>;

  getDelays(): NonNullable<DelayData>;

  getVariables(): NonNullable<Variables>;

  setVariable(name: string, value: string | number): void;

  getGlobalVars(): Record<string, string | undefined>;
}
