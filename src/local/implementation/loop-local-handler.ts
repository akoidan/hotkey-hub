import {Injectable, Logger} from '@nestjs/common';
import {BaseLocalHandler} from '@/local/base-local-handler';
import {LoopLocalCommand, UnknownCommand} from '@/config/types/local-commands';
import clc from 'cli-color';
import {SemaphorService} from '@/semaphor/semaphor-service';

@Injectable()
export class LoopLocalHandler extends BaseLocalHandler {
  constructor(
    private readonly logger: Logger,
    private readonly sempahoreService: SemaphorService,
  ) {
    super();
  }

  canHandle(command: UnknownCommand): command is LoopLocalCommand {
    return Boolean((command as LoopLocalCommand).loop);
  }

  async* execute(comb: LoopLocalCommand): AsyncGenerator<void> {
    for (let i = 0; comb.loop < 0 || i < comb.loop; i++) {
      this.logger.debug(`Running ${clc.yellow(i+1)} iteration`);
      const that = this;
      yield *this.sempahoreService.spawnGeneratorChild(`l=${String(i)}`,  async function* loopGenerator(): AsyncGenerator<void> {
        for (const command of comb.commands!) {
          yield *that.startChain.handle(command, undefined, undefined, undefined);
        }
      });
    }
  }
}

