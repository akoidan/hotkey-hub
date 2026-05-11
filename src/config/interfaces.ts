import type {IpsData} from '@/config/types/root';
import type {Shortcut} from '@/config/types/shortcut';
import type {Variables} from '@/config/types/variables';
import type {DelayData} from '@/config/types/delays';
import type {MacroList} from '@/config/types/local/local-commands';
import type {RgbData} from '@/config/types/rgb';

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
