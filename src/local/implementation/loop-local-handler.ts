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
    protected readonly logger: Logger,
    private readonly evaluateService: EvaluateService,
    private readonly sempahoreService: SemaphorService,
  ) {
    super();
  }

  canHandle(command: UnknownCommand): command is LoopLocalCommand {
    return Boolean((command as LoopLocalCommand).loop);
  }

  async execute(
    comb: LoopLocalCommand,
    combDelayAfter: undefined | number,
    combDelayBefore: undefined | number,
    tId: string | undefined |null,
  ): Promise<void> {
    let i = 0;
    // eslint-disable-next-line no-constant-condition
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
      let j = 0;
      await this.sempahoreService.spawnPromiseChild(`l=${String(i)}`, async() => {
        for (const command of comb.commands!) {
          await this.sempahoreService.spawnPromiseChild(`c=${String(j)}`, async() => {
            await this.startChain.handle(command, undefined, undefined, tId);
          });
          j++;
        }
      });
      i++;
    }
  }
}

