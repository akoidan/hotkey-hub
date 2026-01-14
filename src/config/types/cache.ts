import type {ConfigDataWoMacro} from '@/config/types/schema';
import type {MacroList} from '@/config/types/local/local-commands';

export const schemaRootCache: {
  data: ConfigDataWoMacro,
  macros: MacroList,
} = {data: null!, macros: null!};
