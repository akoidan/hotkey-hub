import {Injectable, Logger} from '@nestjs/common';
import {BaseLocalHandler} from '@/local/base-local-handler';
import {IfLocalCommand, UnknownCommand} from '@/config/types/local-commands';
import clc from 'cli-color';
import {EvaluateService} from '@/local/evaluate-serivce';
import {SemaphorService} from '@/semaphor/semaphor-service';

@Injectable()
export class IfLocalHandler extends BaseLocalHandler {
  constructor(
    private readonly logger: Logger,
    private readonly evaluateService: EvaluateService,
    private readonly semaphoreService: SemaphorService,
  ) {
    super();
  }

  canHandle(command: UnknownCommand): command is IfLocalCommand {
    return (command as IfLocalCommand).if !== undefined;
  }

  async* execute(cmd: IfLocalCommand): AsyncGenerator<void> {
    const ifResult = Boolean(this.evaluateService.evaluateExpression(cmd.if));
    const that = this;
    if (ifResult) {
      this.logger.debug(`If condition evaluated to: ${clc.yellow(String(ifResult))}. Executing if branch`);
      for (let i = 0; i< cmd.then.length; i ++) {
        yield *this.semaphoreService.spawnGeneratorChild(String(i),  async function* loopGenerator(): AsyncGenerator<void> {
           yield *that.startChain.handle(cmd.then[i], undefined, undefined, undefined);
        });
      }
    } else if (cmd.else) {
      this.logger.debug(`If condition evaluated to: ${clc.yellow(String(ifResult))}. Executing else branch`);
      for (let i = 0; i< cmd.then.length; i ++) {
        yield *this.semaphoreService.spawnGeneratorChild(String(i),  async function* loopGenerator(): AsyncGenerator<void> {
          yield *that.startChain.handle(cmd.then[i], undefined, undefined, undefined);
        });
      }
    } else {
      this.logger.debug(`If condition evaluated to: ${clc.yellow(String(ifResult))}. Skipping commands inside`);
    }
  }
}
