import type {ConfigData, ConfigDataWoMacro} from '@/config/types/schema';
import {MacroList} from "@/config/types/macros";

export const schemaRootCache: {
  data: ConfigDataWoMacro,
  macros: MacroList,
} = {data: null!, macros: null!};
