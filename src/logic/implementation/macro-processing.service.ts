import {Injectable} from '@nestjs/common';
import {ConfigService} from '@/config/config-service';
import {UnkownCommand, MacroCommand} from '@/config/types/macros';
import {VariableResolutionService} from '@/logic/variable-resolution.service';
import {DelayService} from '@/logic/delay.service';
import {BaseProcessingService} from '@/logic/implementation/base-processing.service';

@Injectable()
export class MacroProcessingService extends BaseProcessingService {

  constructor(
      private readonly configService: ConfigService,
      private readonly variableService: VariableResolutionService,
      private readonly delayService: DelayService,
  ) {
    super();
  }

  canHandle(command: UnkownCommand): command is MacroCommand {
    return Boolean((command as MacroCommand).macro);
  }

  public async execute(
    input: MacroCommand,
    combDelayAfter: number | undefined,
    combDelayBefore: number | undefined,
    tId: string | undefined,
  ): Promise<void> {
    const executable = this.configService.getMacros()[(input as MacroCommand).macro];
    if (typeof input.delayBefore === 'number') { // ignore if it's a variable or undefined
      // if it's a macro, delay in this macro won't be passed down
      // but would be await after any commands in this macro has run yet as expected, this is why on top we are not passing it
      await this.delayService.awaitDelay(input.delayBefore as number, undefined, 'before');
    }
    for (const command of executable.commands) {
      const preparedCommand = this.variableService.replacePlaceholders(
          command,
          (input as MacroCommand).variables,
          executable.variables
      );
      const delayA = (preparedCommand.delayAfter as number | undefined) ?? combDelayAfter;
      const delayB = (preparedCommand.delayBefore as number | undefined) ?? combDelayBefore;
      await this.startChain.handle(preparedCommand, delayA, delayB, tId);
    }
    // commands in this macro has been already ran in the loop
    // await delay before the next command after this macro runs
    if (typeof input.delayAfter === 'number') { // ignore if it's a variable or undefined
      await this.delayService.awaitDelay(input.delayAfter as number, undefined, 'after'); // if it's a macro, delay in this macro won't be passed down
      // but would be await after all commands in this macro as expected, this is why on top we are not passing it
    }
  }
}
