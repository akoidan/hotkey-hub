import type {
  AliasesData,
  IpsData,
  RgbData,
} from '@/config/types/schema';
import type {ShortsData} from '@/config/types/shortcut';
import type {MacroList} from '@/config/types/macros';
import type {Variables} from '@/config/types/variables';
import type {DelayData} from '@/config/types/delays';

export interface ConfigProvider {
  getIps(): IpsData;

  getOpenRgb(): RgbData;

  getCombinations(): ShortsData[];

  getAliases(): NonNullable<AliasesData>;

  getMacros(): NonNullable<MacroList>;

  getDelays(): NonNullable<DelayData>;

  getVariables(): NonNullable<Variables>;

  setVariable(name: string, value: string | number): Promise<void>;

  getGlobalVars(): Record<string, string | undefined>;
}
