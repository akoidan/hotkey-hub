import {Injectable} from '@nestjs/common';
import {ConfigService} from '@/config/config-service';
import {Command} from '@/config/types/commands';
import {
  CommandOrMacro,
  MacroCommand,
} from '@/config/types/macros';
import {VariableResolutionService} from 'src/logic/variable-resolution.service';
import {BaseCommandHandler} from 'src/logic/commands/base-command-handler';

@Injectable()
export class CommandProcessingService {
  constructor(
    private readonly configService: ConfigService,
    private readonly variableService: VariableResolutionService,
    private readonly commandChain: BaseCommandHandler
  ) {

  }

  async resolveMacroAndAlias(input: CommandOrMacro, resolveAlias = true): Promise<void> {
    if ((input as MacroCommand).macro) {
      const executable = this.configService.getMacros()[(input as MacroCommand).macro];
      for (const command of executable.commands) {
        await this.resolveMacroAndAlias(
          this.variableService.replacePlaceholders(command, (input as MacroCommand).variables),
          true
        );
      }
    } else if (resolveAlias) {
      const commands = this.resolveAliases(input as Command);
      for (const command of commands) {
        await this.resolveMacroAndAlias(command, false);
      }
    } else {
      await this.runCommand(input as Command);
    }
  }

  private async runCommand(input: Command): Promise<void> {
    const currRec = this.variableService.replaceEnvVars(input);
    const ip = this.configService.getIps()[(currRec as Command).destination];
    await this.commandChain.handle(ip, currRec);
  }

  resolveAliases(rec: Command): Command[] {
    if (this.configService.getIps()[rec.destination]) {
      return [{...rec, destination: rec.destination}];
    }
    const destination = this.configService.getAliases()[rec.destination];
    if (typeof destination === 'string') {
      return this.resolveAliases({...rec, destination});
    }
    if (Array.isArray(destination)) {
      return destination.flatMap(dest => this.resolveAliases({...rec, destination: dest}));
    }
    throw Error(`Unknown destination ${rec.destination}`);
  }
}
