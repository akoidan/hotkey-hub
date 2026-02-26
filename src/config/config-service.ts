/* eslint-disable max-lines*/
import {ConfigData, configSchema, IpsData, RgbData} from '@/config/types/root';
import {parse} from 'jsonc-parser';
import {Inject, Injectable, Logger} from '@nestjs/common';
import {ZodError, ZodIssue, ZodSchema} from 'zod';
import {schemaRootCache} from '@/config/types/cache';
import {Variables, variablesSchema} from '@/config/types/variables';
import {Shortcut} from '@/config/types/shortcut';
import {ConfigProvider} from '@/config/interfaces';
import {ConfigReaderService} from '@/config/config-reader-service';
import clc from 'cli-color';
import {DelayData} from '@/config/types/delays';
import {ConfigCombination, SAVE_TIMEOUT} from '@/config/config-model';
import {MacroList} from '@/config/types/local/local-commands';
import {ENV, ZodErrorCollected} from '@/config/types/config-path';
import prompts from 'prompts';
import {basename} from 'path';

@Injectable()
export class ConfigService implements ConfigProvider {
  private configData: ConfigData | null = null;

  private variables: Variables = {} as Variables;

  private variablesSaveTimeoutId: NodeJS.Timeout | null = null;

  // eslint-disable-next-line @typescript-eslint/max-params
  constructor(
    private readonly logger: Logger,
    @Inject(ENV)
    private readonly envVars: Record<string, string | undefined>,
    private readonly configReader: ConfigReaderService,
    @Inject(SAVE_TIMEOUT)
    private readonly saveTimeout: number,
  ) {
    this.logger.verbose(`Created new instance of config service from ${configReader.getConfigPath()}`);
  }


  private collectAllErrors(
    issue: ZodError | ZodIssue | ZodIssue[],
    errors: ZodErrorCollected[],
    currentPath: (string | number)[] = []
  ): void {
    if (Array.isArray(issue)) {
      for (const subIssue of issue) {
        this.collectAllErrors(subIssue, errors, currentPath);
      }
    } else if (issue instanceof ZodError) {
      for (const subIssue of issue.issues) {
        this.collectAllErrors(subIssue, errors, currentPath);
      }
    } else if ((issue as ZodIssue).code === 'invalid_union') {
      const unionIssue = issue as ZodIssue & { errors: ZodError[] };
      for (const unionError of unionIssue.errors) {
        this.collectAllErrors(unionError, errors, currentPath);
      }
    }
    const zodIssue = issue as ZodIssue;
    if (zodIssue.path) {
      currentPath = [...(zodIssue.path as (string | number)[])];
    }
    this.extractIssue(issue as ZodIssue, errors);
  }

  private extractIssue(zodIssue: ZodIssue, errors: ZodErrorCollected[]): void {
    if (zodIssue.message && zodIssue.path?.length > 0 && zodIssue.message !== 'Invalid input') {
      const errorObj: ZodErrorCollected = {
        path: zodIssue.path.join('.'),
        message: zodIssue.message,
      };
      if ((zodIssue as ZodIssue).code === 'invalid_type') {
        const typeIssue = zodIssue as ZodIssue & { expected?: string[], received?: string };
        if (typeIssue.expected) {
          errorObj.expected = typeIssue.expected;
        }
        if (typeIssue.received) {
          errorObj.received = typeIssue.received;
        }
      }
      errors.push(errorObj);
    }
  }

  private formatZodError(error: ZodError): string {
    const errors: ZodErrorCollected[] = [];
    this.collectAllErrors(error, errors);

    if (errors.length > 0) {
      // Format the first error in detail
      const [firstError] = errors;
      let errorMessage = `${firstError.message} at ${firstError.path}`;

      if (firstError.expected && firstError.received) {
        /* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */
        errorMessage += ` (expected ${firstError.expected}, received ${firstError.received})`;
      }

      // If there are more errors, mention them briefly
      if (errors.length > 1) {
        const otherErrors = errors.slice(1, 4); // Show up to 3 more errors
        const more = errors.length - 1 > otherErrors.length ? ` and ${errors.length - 1 - otherErrors.length} more` : '';
        const moreString = more ? `\n... ${more} errors not shown` : '';
        const otherErrorMessages = otherErrors.map(e => `- ${e.path}: ${e.message}`).join('\n');
        errorMessage += `\nOther issues:\n${otherErrorMessages}${moreString}`;
      }

      return errorMessage;
    }

    // If we couldn't find specific errors, show a more helpful message
    return 'Validation failed. Please check your configuration. ' +
      'This might be due to a required field missing or an invalid value type.';
  }

  private async validateWithErrorHandling<T>(schema: ZodSchema, data: any, context: string): Promise<T> {
    try {
      return await schema.parseAsync(data) as T;
    } catch (error) {
      if (error instanceof ZodError) {
        throw new Error(`[${context}] ${this.formatZodError(error)}`, {
          cause: error,
        });
      }
      throw error;
    }
  }

  public async validateVariableConf(): Promise<Variables> {
    this.logger.debug('Validating variables config');
    const variablesConfigString = await this.configReader.loadVariablesConfigString();
    const variables = variablesConfigString ? parse(variablesConfigString) as Variables : {};
    return this.validateWithErrorHandling(variablesSchema, variables, 'Variables Config');
  }

  private printShortcuts(): void {
    const combinations = (this.configData!.combinations as Shortcut[])
      .map((combination): ConfigCombination => ({
        shortCut: combination.shortCut,
        name: combination.name,
      }))
      .sort((a, b) => a.shortCut.localeCompare(b.shortCut));

    combinations.forEach((combination) => {
      this.logger.log(`${clc.green.bold(combination.shortCut)}: ${combination.name}`);
    });
  }

  public async loadConfig(): Promise<void> {
    if (this.configData) {
      throw new Error('Config already loaded');
    }
    await this.parseConfig();
    this.printShortcuts();
  }

  public async parseConfig(): Promise<void> {
    this.logger.debug('parsing config');
    const variables = await this.validateVariableConf();
    this.logger.debug('Validating global config');
    await this.initConfigFilePath(variables);
    const configString = await this.configReader.loadConfigString();
    const parsedNoDefault = parse(configString) as ConfigData;
    schemaRootCache.data = parsedNoDefault;
    const configData = await this.validateWithErrorHandling<ConfigData>(configSchema, parsedNoDefault, 'main confg');
    schemaRootCache.data = null!;
    this.configData = configData;
    this.variables = variables;
    this.setVariable('delays', configData.delays);
    if (!variables.configPath) {
      variables.configPath = [];
    }
    const configPath = this.configReader.getConfigPath();
    if (Array.isArray(variables.configPath) && !variables.configPath.includes(configPath)) {
      variables.configPath.push(configPath);
    }
    this.setVariable('configPath', variables.configPath);
    if (this.configData.name) {
      this.logger.log(`Loaded config ${clc.bold.green(this.configData.name)} from ${configPath}`);
    } else {
      this.logger.log(`Loaded config from ${configPath}`);
    }
  }

  private async initConfigFilePath(variables: Variables): Promise<void> {
    if (!this.configReader.getConfigProvided() && Array.isArray(variables.configPath) && variables.configPath?.length > 1) {
      this.logger.log('--config-file option was not provided, adding select options');
      const response = await prompts({
        type: 'select',
        // eslint-disable-next-line sonarjs/no-duplicate-string
        name: 'config-file',
        message: 'Select config file',
        choices: variables.configPath.map(a => ({title: basename(a), value: a})),
      });
      // if ctrl+c is presssed it returns empty object
      if (!response['config-file']) {
        this.logger.error('Config file selection was cancelled');
        throw new Error('Config file selection was cancelled');
      }
      this.configReader.setConfigFile(response['config-file'] as string);
    }
  }

  public getName(): string {
    return this.configData!.name ?? basename(this.configReader.getConfigPath());
  }

  public getIps(): IpsData {
    return this.configData!.ips;
  }

  public getOpenRgb(): RgbData {
    return this.configData!.rgb;
  }

  public getCombinations(): Shortcut[] {
    return this.configData!.combinations;
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
    return this.configData!.clientPort!;
  }

  public setVariable(name: string, value: unknown): void {
    this.variables[name] = value;
    if (this.saveTimeout < 0) {
      return; // do not perform save on tests
    }
    if (this.variablesSaveTimeoutId) {
      clearTimeout(this.variablesSaveTimeoutId);
    }
    // prevent multiple saves during sync actions
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    const timeoutId = setTimeout(async(): Promise<void> => {
      this.variablesSaveTimeoutId = null;
      try {
        await this.configReader.saveVariablesConfigString(this.variables);
      } catch(e) {
        this.logger.error(`Unable to save variables because ${e?.message || e}`, e.stack);
      }
    }, this.saveTimeout); // I hope save to disk a file takes less than 1s,
    // so we dont save while other process is saving
    // also prevents multiple async spam for variables backup
    // we can sacrifice 1s of old variable
    // eslint-disable-next-line
    this.logger.verbose(`Added timeout #${timeoutId} for ${this.saveTimeout}ms`);
    this.variablesSaveTimeoutId = timeoutId;
  }

  public getGlobalVars(): Record<string, string | undefined> {
    return this.envVars;
  }
}
