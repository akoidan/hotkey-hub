import {
  aARootSchema,
  AliasesData,
  ConfigData,
  IpsData,
  macrosDefinitionSchema,
  RgbData,
  variablesSchema,
} from '@/config/types/schema';
import {parse} from 'jsonc-parser';
import {
  Injectable,
  Logger,
} from '@nestjs/common';
import {schemaRootCache} from '@/config/types/cache';
import {Variables} from '@/config/types/variables';
import {MacroList} from '@/config/types/macros';
import {ShortsData} from '@/config/types/shortcut';
import {ConfigProvider} from '@/config/interfaces';
import {ConfigReaderService} from '@/config/config-reader-service';
import clc from 'cli-color';
import {DelayData} from '@/config/types/delays';
import {ConfigCombination} from '@/config/config-model';

@Injectable()
export class ConfigService implements ConfigProvider {
  private configData: ConfigData | null = null;

  private variables: Variables = {};

  private variablesSaveLock: Promise<any> | null = null;
  private variablesSaveLockIteration: number = 1;

  // eslint-disable-next-line @typescript-eslint/max-params
  constructor(
    private readonly logger: Logger,
    private readonly envVars: Record<string, string | undefined>,
    private readonly configReader: ConfigReaderService,
  ) {
    this.logger.debug('Created new instance of config service');
  }

  public async parseConfig(): Promise<void> {
    this.logger.debug('parsing config');
    if (this.configData) {
      throw new Error('Config already loaded');
    }
    const configString = await this.configReader.loadConfigString();
    const macroConfigString = await this.configReader.loadMacroConfigString();
    const variablesConfigString = await this.configReader.loadVariablesConfigString();

    schemaRootCache.data = parse(configString) as ConfigData;
    const separateMacros: NonNullable<MacroList> = macroConfigString ? parse(macroConfigString) as NonNullable<MacroList> : {};
    const ownMacros: NonNullable<MacroList> = schemaRootCache.data?.macros ?? {};

    this.variables = variablesConfigString ? parse(variablesConfigString) as Variables : {};

    this.logger.debug('Validating variables config');
    await variablesSchema.parseAsync(this.variables);

    this.logger.debug('Validating macro config');
    // eslint-disable-next-line require-atomic-updates
    schemaRootCache.data.macros = separateMacros;
    await macrosDefinitionSchema.parseAsync(separateMacros);

    if (Object.keys(separateMacros).length > 0) {
      this.logger.debug('Merging separate macros with own');
      // eslint-disable-next-line require-atomic-updates
      schemaRootCache.data.macros = {...separateMacros, ...ownMacros};
    }

    this.logger.debug('Validating global config');
    await aARootSchema.parseAsync(schemaRootCache.data);

    const combinations = (schemaRootCache.data.combinations as ShortsData[])
      .map((combination): ConfigCombination => ({
        shortCut: combination.shortCut,
        name: combination.name,
      }))
      .sort((a, b) => a.shortCut.localeCompare(b.shortCut));

    combinations.forEach((combination) => {
      this.logger.log(`${clc.green.bold(combination.shortCut)}: ${combination.name}`);
    });

    this.configData = schemaRootCache.data;

    schemaRootCache.data = null!;
    await this.setVariable('delays', this.configData!.delays);
  }

  public getIps(): IpsData {
    return this.configData!.ips;
  }

  public getOpenRgb(): RgbData {
    return this.configData!.rgb;
  }

  public getCombinations(): ShortsData[] {
    return this.configData!.combinations;
  }

  public getAliases(): NonNullable<AliasesData> {
    return this.configData!.aliases ?? {};
  }

  public getMacros(): NonNullable<MacroList> {
    return this.configData!.macros ?? {};
  }

  public getVariables(): NonNullable<Variables> {
    return this.variables;
  }

  public getDelays(): NonNullable<DelayData> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.variables?.delays ?? ({} as NonNullable<DelayData>);
  }

  public getClientPort(): number {
    return this.configData!.clientPort || 5000;
  }

  public async setVariable(name: string, value: unknown): Promise<void> {
    this.variables[name] = value;
    this.variablesSaveLockIteration++;
    const iteration = this.variablesSaveLockIteration;
    if (this.variablesSaveLock) {
      this.logger.debug(`Save variables #${iteration}. Awaiting lock release`);
      await this.variablesSaveLock;
      this.logger.debug(`Save variables #${iteration}. Locked release`);
    } else {
      this.logger.debug(`Save variables #${iteration}. Lock doesn't exist. Commiting to main thread`);
    }
    if (iteration !== this.variablesSaveLockIteration) {
      this.logger.debug(`Save variables #${iteration}. Dropping current iteration to save variable for more prior one`);
      return;
    }
    let resolve: (a?: unknown) => void = null!;
    this.variablesSaveLock = new Promise(r => {
      resolve = r;
    });
    await this.configReader.saveVariablesConfigString(this.variables);
    this.logger.debug(`Save variables #${iteration}. Iteration finished, releasing lock`);
    this.variablesSaveLock = null;
    resolve();
  }

  public getGlobalVars(): Record<string, string | undefined> {
    return this.envVars;
  }
}
