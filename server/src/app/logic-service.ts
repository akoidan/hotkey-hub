/* eslint-disable max-lines */
import {
  BaseCommand,
  Command,
  ExecuteCommand,
  FocusWindowCommand,
  Key,
  KeyPressCommand,
  KillCommand,
  MouseClickCommand,
  TypeTextCommand,
} from '@/config/types/commands';
import {
  ShortsData,
  RandomShortcutMapping,
  MacroShortcutMapping,
} from '@/config/types/shortcut';
import {ConfigService} from '@/config/config-service';
import {ClientService} from '@/client/client-service';
import {
  Injectable,
  Logger,
} from '@nestjs/common';
import {
  CommandOrMacro,
  MacroCommand,
} from '@/config/types/macros';

@Injectable()
export class LogicService {
  constructor(
    private readonly configService: ConfigService,
    private readonly clientService: ClientService,
    private readonly logger: Logger,
  ) {
  }

  private activeFighterIndex = 0;

  async pingClients(): Promise<unknown[]> {
    this.logger.debug('Pinging clients...');
    return Promise.all(
      Object.entries(this.configService.getIps())
        .map(async([_, ip]) => this.clientService.ping(ip))
    );
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  private async runCommand(input: CommandOrMacro, resolveAlias = true): Promise<void> {
    if ((input as MacroCommand).macro) {
      const executable = this.configService.getMacros()[(input as MacroCommand).macro];
      for (const command of executable.commands) {
        await this.runCommand(this.replacePlaceholders(command, (input as MacroCommand).variables));
      }
      return;
    }
    let currRec: Command = input as Command;
    if (resolveAlias) {
      const commands = this.resolveAliases(currRec);
      for (const command of commands) {
        await this.runCommand(command, false);
      }
      return ;
    }
    currRec = this.replaceEnvVars(currRec);
    const ip = this.configService.getIps()[(currRec as BaseCommand).destination];
    const keySend: KeyPressCommand = currRec as KeyPressCommand;
    if (keySend.keySend) {
      let holdKeys: Key[] = [];
      if (Array.isArray(keySend.holdKeys)) {
        // eslint-disable-next-line @typescript-eslint/prefer-destructuring
        holdKeys = keySend.holdKeys;
      } else if (typeof keySend.holdKeys === 'string') {
        holdKeys = [keySend.holdKeys as Key];
      }
      await this.clientService.keyPress(ip, {
        keys: (Array.isArray(keySend.keySend) ? keySend.keySend : [keySend.keySend]) as Key[],
        holdKeys,
      });
    } else if ((currRec as FocusWindowCommand).focusPid) {
      await this.clientService.focusExe(ip, {
        pid: (currRec as FocusWindowCommand).focusPid as number,
      });
    } else if ((currRec as MouseClickCommand).mouseMoveX) {
      await this.clientService.mouseClick(ip, {
        x: (currRec as MouseClickCommand).mouseMoveX as number,
        y: (currRec as MouseClickCommand).mouseMoveY as number,
      });
    } else if ((currRec as ExecuteCommand).launch) {
      const response = await this.clientService.launchExe(ip, {
        path: (currRec as ExecuteCommand).launch,
        arguments: (currRec as ExecuteCommand).arguments ?? [],
        waitTillFinish: (currRec as ExecuteCommand).waitTillFinish ?? false,
      });
      if ((currRec as ExecuteCommand).assignId) {
        await this.configService.setVariable((currRec as ExecuteCommand).assignId!, response.pid);
      }
    } else if ((currRec as TypeTextCommand).typeText) {
      await this.clientService.typeText(ip, {
        text: (currRec as TypeTextCommand).typeText,
      });
    } else if ((currRec as KillCommand).kill) {
      await this.clientService.killExe(ip, {
        name: (currRec as KillCommand).kill,
      });
    } else {
      throw Error(`Unknown receiver type ${JSON.stringify(currRec)}`);
    }
  }

  private replacePlaceholders<T extends object>(obj: T, variables: Record<string, unknown> | undefined): T {
    if (!variables) {
      return obj;
    }
    const result: Partial<T> = {};
    for (const [key, value] of Object.entries(obj) as [keyof T, T[keyof T]][]) {
      result[key] = value;
      for (const varName in variables) {
        if (value === `{{${varName}}}`) {
          result[key] = variables[varName] as T[keyof T];
        }
      }
    }
    return result as T;
  }

  private replaceEnvVars<T extends object>(obj: T): T {
    const result: Partial<T> = {};
    for (const [key, value] of Object.entries(obj) as [keyof T, T[keyof T]][]) {
      if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
        const globalVars = this.configService.getGlobalVars();
        const scriptVars = this.configService.getVariables();
        const varName = value.slice(2, -2);
        if (this.configService.getVariables()[varName]) {
          result[key] = this.configService.getVariables()[varName] as T[keyof T];
        } else if (globalVars[varName]) {
          result[key] = globalVars[varName] as T[keyof T];
        } else if (scriptVars[varName]) {
          result[key] = scriptVars[varName] as T[keyof T];
        } else {
          throw Error(`Unknown environment variable ${value}`);
        }
      } else {
        result[key] = value;
      }
    }
    return result as T;
  }

  public async processUnknownShortCut(comb: ShortsData): Promise<void> {
    this.logger.log(`${comb.shortCut} pressed`);
    if ((comb as RandomShortcutMapping).circular! || (comb as RandomShortcutMapping).shuffle!) {
      await this.processShortcutsWoMacro((comb as RandomShortcutMapping));
    } else if ((comb as MacroShortcutMapping).commands) {
      await this.processCommandWithMacro(comb.commands!, comb.delay);
    } else if ((comb as MacroShortcutMapping).threads) {
      await Promise.all((comb as MacroShortcutMapping).threads!.map(async receiver => {
        await this.processCommandWithMacro(receiver, comb.delay);
      }));
    }
  }

  private async processShortcutsWoMacro(
    comb: RandomShortcutMapping,
  ): Promise<void> {
    const commands = comb.commands.flatMap(comm => this.resolveAliases(comm));
    if (comb.circular && commands.length > 0) {
      await this.runCommand(commands[this.activeFighterIndex], false);
      if (this.activeFighterIndex >= commands.length - 1) {
        this.activeFighterIndex = 0;
      } else if (this.activeFighterIndex + 1 <= commands.length - 1) {
        this.activeFighterIndex++;
      }
    } else {
      if (comb.shuffle) {
        this.shuffle(commands);
      }
      await this.processCommandWithMacro(commands, comb.delay);
    }
  }

  private async processCommandWithMacro(commands: CommandOrMacro[], delay: number | undefined) {
    for (const receiver of commands) {
      await this.runCommand(receiver);
      await this.awaitDelay(delay, receiver.delay as number);
    }
  }

  private resolveAliases(rec: Command): Command[] {
    if (this.configService.getIps()[rec.destination]) {
      return [{...rec, destination: rec.destination}];
    }
    const commands: Command[] = [];
    const destination = this.configService.getAliases()[rec.destination];
    if (typeof destination === 'string') {
      commands.push({...rec, destination});
    } else if (Array.isArray(destination)) {
      destination.forEach(dest => {
        commands.push({...rec, destination: dest});
      });
    } else {
      throw Error(`Unknown destination type ${rec.destination}`);
    }
    return commands;
  }

  private async awaitDelay(combDelay: undefined | number, receiverDelay: undefined | number): Promise<void> {
    if (receiverDelay !== undefined) {
      combDelay = receiverDelay;
    }
    if (combDelay === undefined) {
      combDelay = Math.round(Math.random() * this.configService.getDelay());
    }
    await new Promise(resolve => {
      setTimeout(resolve, combDelay);
    });
  }

  private shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}
