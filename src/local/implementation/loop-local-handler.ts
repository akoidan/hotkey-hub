import {Injectable, Logger} from '@nestjs/common';
import {BaseLocalHandler} from '@/local/base-local-handler';
import {LoopLocalCommand} from '@/config/types/local/local-commands';
import {UnknownCommand} from '@/config/types/commands';
import clc from 'cli-color';
import {SemaphorService} from '@/semaphor/semaphor-service';
import {EvaluateService} from '@/local/evaluate-serivce';

@Injectable()
export class LoopLocalHandler extends BaseLocalHandler {
  constructor(
    private readonly logger: Logger,
    private readonly evaluateService: EvaluateService,
    private readonly sempahoreService: SemaphorService,
  ) {
    super();
  }

  canHandle(command: UnknownCommand): command is LoopLocalCommand {
    return Boolean((command as LoopLocalCommand).loop);
  }

  async* execute(comb: LoopLocalCommand): AsyncGenerator<void> {
    let i = 0;
    const that = this;
    while (true) {
      if (typeof comb.loop === 'string') {
        const ifContinue: unknown = this.evaluateService.evaluateExpression(comb.loop);
        if (ifContinue) {
          this.logger.debug(`${comb.loop} evaluated to ${String(ifContinue)}, running ${clc.yellow(i + 1)} iteration`);
        } else {
          this.logger.debug(`${comb.loop} evaluated to ${String(ifContinue)}, breaking loop`);
          break;
        }
      } else if (comb.loop > 0) {
        if (i >= comb.loop) {
          this.logger.debug('Got to the end of the cycle, exiting');
          break;
        }
      } else {
        this.logger.debug(`Running ${clc.yellow(i + 1)} iteration`);
      }
      const j = i;
      yield* this.sempahoreService.spawnGeneratorChild(`l=${String(i)}`, async function* loopGenerator(): AsyncGenerator<void> {
        for (const command of comb.commands!) {
          yield* that.sempahoreService.spawnGeneratorChild(`c=${String(j)}`, async function* commandGenerator(): AsyncGenerator<void> {
            yield* that.startChain.handle(command, undefined, undefined, undefined);
          });
        }
      });
      i++;
    }
  }
}

