import {Injectable} from '@nestjs/common';
import {ConfigService} from '@/config/config-service';
import {VariableResolutionService} from '@/local/variable-resolution.service';
import {DelayService} from '@/local/delay.service';
import {BaseLocalHandler} from '@/local/base-local-handler';
import {MacroLocalCommand} from '@/config/types/local/local-commands';
import {UnknownCommand} from '@/config/types/commands';
import {Delay} from '@/config/types/remote/base-remote-command';
import {SemaphorService} from '@/semaphor/semaphor-service';
import {QueueItem} from '@/generator/generator-model';

@Injectable()
export class MacroLocalHandler extends BaseLocalHandler {
  constructor(
    private readonly configService: ConfigService,
    private readonly variableService: VariableResolutionService,
    private readonly semaphoreService: SemaphorService,
    private readonly delayService: DelayService,
  ) {
    super();
  }

  canHandle(command: UnknownCommand): command is MacroLocalCommand {
    return Boolean((command as MacroLocalCommand).macro);
  }

  public async execute(
    input: MacroLocalCommand,
    combDelayAfter: number | undefined,
    combDelayBefore: number | undefined,
    tId: string | undefined | null,
  ): Promise<void> {
    const executable = this.configService.getMacros()[input.macro];
    if (!executable) {
      throw new Error(`Macro ${input.macro} not found.`);
    }
    const that = this;
    yield* that.semaphoreService.spawnPromiseChild(
      `m=${input.macro}`,
      async function* macroGenerator(): Promise<void> {
        if (typeof input.delayBefore === 'number') { // ignore if it's a variable or undefined
          // if it's a macro, delay in this macro won't be passed down
          // but would be await after any commands in this macro has run yet as expected, this is why on top we are not passing it
          yield* that.delayService.awaitDelay(input.delayBefore as number, undefined, 'before', 'macro');
        }
        for (let i = 0; i < executable.commands.length; i++) {
          yield* that.semaphoreService.spawnPromiseChild(
            `c=${String(i)}`,
            async function* loopGenerator(): Promise<void> {
              const preparedCommand = that.variableService.replaceMacroVariables(
                executable.commands[i],
                input.variables,
                executable.variables
              );
              const delayA = ((preparedCommand as Delay).delayAfter as number | undefined) ?? combDelayAfter;
              const delayB = ((preparedCommand as Delay).delayBefore as number | undefined) ?? combDelayBefore;
              yield* that.startChain.handle(preparedCommand, delayA, delayB, tId);
            }
          );
        }
        // commands in this macro has been already ran in the loop
        // await delay before the next command after this macro runs
        if (typeof input.delayAfter === 'number') { // ignore if it's a variable or undefined
          yield* that.delayService.awaitDelay(input.delayAfter as number, undefined, 'after', 'macro'); // if it's a macro, delay in this macro won't be passed down
          // but would be await after all commands in this macro as expected, this is why on top we are not passing it
        }
      },
      '='
    );
  }
}
