import {aARootSchema, ConfigData, ConfigDataWoMacro, IpsData, macrosListSchema, RgbData} from '@/config/types/schema';
import {parse} from 'jsonc-parser';
import {Inject, Injectable, Logger} from '@nestjs/common';
/* eslint-disable max-lines*/
import {ZodError, ZodSchema} from 'zod';
import {schemaRootCache} from '@/config/types/cache';
import {Variables, variablesSchema} from '@/config/types/variables';
import {Shortcut} from '@/config/types/shortcut';
import {ConfigProvider} from '@/config/interfaces';
import {ConfigReaderService} from '@/config/config-reader-service';
import clc from 'cli-color';
import {DelayData} from '@/config/types/delays';
import {ConfigCombination} from '@/config/config-model';
import {MacroList} from '@/config/types/local-commands';
import {ENV, ZodErrorCollected} from '@/config/types/config-path';
import {ZodInvalidTypeIssue, ZodInvalidUnionIssue, ZodIssue} from 'zod/lib/ZodError';

@Injectable()
export class ConfigService implements ConfigProvider {
  private configData: ConfigDataWoMacro | null = null;
  private macros: NonNullable<MacroList> = null!;

  private variables: Variables = {};

  private variablesSaveTimeoutId: NodeJS.Timeout | null = null;

  // eslint-disable-next-line @typescript-eslint/max-params
  constructor(
    private readonly logger: Logger,
    @Inject(ENV)
    private readonly envVars: Record<string, string | undefined>,
    private readonly configReader: ConfigReaderService,
  ) {
    this.logger.debug(`Created new instance of config service from ${configReader.getId()}`);
  }


  private collectAllErrors(
    issue: ZodError | ZodInvalidUnionIssue | ZodIssue,
    errors: ZodErrorCollected[],
    currentPath: (string | number)[] = []
  ): void {
    const zodissues = (issue as ZodError).issues;
    const zodUnionErrors = (issue as ZodInvalidUnionIssue).unionErrors;
    if (Array.isArray(zodissues)) {
      for (const subIssue of zodissues) {
        this.collectAllErrors(subIssue, errors, currentPath);
      }
    } else if (zodUnionErrors) {
      for (const unionError of zodUnionErrors) {
        this.collectAllErrors(unionError, errors, currentPath);
      }
    }

    const zodIssue = issue as ZodIssue;
    const zodInvalidTypeIssue = issue as ZodInvalidTypeIssue;
    if (zodIssue.path) {
      currentPath = [...zodIssue.path];
    }

    if (zodIssue.message && zodIssue.path?.length > 0 && zodIssue.message !== 'Invalid input') {
      errors.push({
        path: zodIssue.path.join('.'),
        message: zodIssue.message,
        ...(zodInvalidTypeIssue.expected && {expected: zodInvalidTypeIssue.expected}),
        ...(zodInvalidTypeIssue.received && {received: zodInvalidTypeIssue.received}),
      });
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
        throw new Error(`[${context}] ${this.formatZodError(error)}`);
      }
      throw error;
    }
  }

  public async validateVariableConf(): Promise<Record<string, any>> {
    this.logger.debug('Validating variables config');
    const variablesConfigString = await this.configReader.loadVariablesConfigString();
    const variables = variablesConfigString ? parse(variablesConfigString) as Variables : {};
    return this.validateWithErrorHandling(variablesSchema, variables, 'Variables Config');
  }

  public async validateMacroConf(): Promise<NonNullable<MacroList>> {
    this.logger.debug('Validating macro config');
    const macroConfigString = await this.configReader.loadMacroConfigString();
    const separateMacros: NonNullable<MacroList> = macroConfigString ? parse(macroConfigString) as NonNullable<MacroList> : {};
    schemaRootCache.macros = separateMacros;
    await this.validateWithErrorHandling(macrosListSchema, separateMacros, 'Macro Config');
    schemaRootCache.macros = null!;
    return separateMacros;
  }

  public async validateOwnConfig(separateMacros: NonNullable<MacroList>): Promise<{
    macros: NonNullable<MacroList>,
    configData: ConfigData
  }> {
    this.logger.debug('Validating global config');
    const configString = await this.configReader.loadConfigString();
    const confValueWithMacro = parse(configString) as ConfigData;
    const {macros: ownMacros, ...configValueWoMacro} = confValueWithMacro;
    if (ownMacros && Object.keys(ownMacros).length > 0) {
      this.logger.debug('Merging separate macros with own');
      schemaRootCache.macros = {...separateMacros, ...ownMacros};
    } else {
      schemaRootCache.macros = separateMacros;
    }
    schemaRootCache.data = configValueWoMacro;
    await this.validateWithErrorHandling(aARootSchema, confValueWithMacro, 'main confg');
    const configData = schemaRootCache.data;
    const macros = schemaRootCache.macros ?? {};
    schemaRootCache.data = null!;
    schemaRootCache.macros = null!;
    return {macros, configData};
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
    const separateMacros = await this.validateMacroConf();
    const {macros, configData} = await this.validateOwnConfig(separateMacros);
    this.macros = macros;
    this.configData = configData;
    this.variables = variables;
    this.setVariable('delays', configData.delays);
    if (this.configData.name) {
      this.logger.log(`Loaded config ${clc.bold.green(this.configData.name)}`);
    }
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
    return this.macros;
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

  public setVariable(name: string, value: unknown): void {
    this.variables[name] = value;
    if (this.variablesSaveTimeoutId) {
      clearTimeout(this.variablesSaveTimeoutId);
    }
    // prevent multiple saves during sync actions
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    const timeoutId = setTimeout(async(): Promise<void> => {
      this.variablesSaveTimeoutId = null;
      try {
        await this.configReader.saveVariablesConfigString(this.variables);
        this.logger.debug(`Saved variables files from ${clc.green(name)}=${JSON.stringify(value)}`);
      } catch(e) {
        this.logger.error(`Unable to save variables because ${e?.message || e}`, e.stack);
      }
    }, 1000); // I hope save to disk a file takes less than 1s,
    // so we dont save while other process is saving
    // also prevents multiple async spam for variables backup
    // we can sacrifice 1s of old variable
    this.variablesSaveTimeoutId = timeoutId;
  }

  public getGlobalVars(): Record<string, string | undefined> {
    return this.envVars;
  }
}
