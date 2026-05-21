import {Inject, Injectable, Logger} from '@nestjs/common';
import {BaseLocalHandler} from '@/local/base-local-handler';
import {UnknownCommand} from '@/config/types/commands';
import {SemaphorService} from '@/semaphor/semaphor-service';
import {PromptLocalCommand} from '@/config/types/local/prompt-local-command';
import prompts, {PromptObject} from 'prompts';
import {ASYNC_PROVIDER} from '@/asyncstore/async-storage-const';
import {AsyncLocalStorage} from 'async_hooks';
import {PROCESS_TOKEN} from '@/local/local-model';
import {ConfigService} from '@/config/config-service';

@Injectable()
export class PromptLocalHandler extends BaseLocalHandler {
  constructor(
    protected readonly logger: Logger,
    private readonly configService: ConfigService,
    @Inject(ASYNC_PROVIDER)
    private readonly asyncLocalStorage: AsyncLocalStorage<Map<string, any>>,
    @Inject(PROCESS_TOKEN)
    private readonly process: NodeJS.Process
  ) {
    super();
  }

  canHandle(command: UnknownCommand): command is PromptLocalCommand {
    return 'prompt' in (command as PromptLocalCommand);
  }

  async execute(
    comb: PromptLocalCommand,
  ): Promise<void> {
    const controller: AbortController = this.asyncLocalStorage.getStore()!.get(SemaphorService.ABORT_CONTROLLER) as AbortController;
    const combKey = this.asyncLocalStorage.getStore()!.get(SemaphorService.COMB_KEY) as string;

    const abortHandler = (): void => {
      this.logger.debug(`Aborting prompt ${combKey}`);
      this.process.stdin.emit('keypress', '', {name: 'abort'});
    };

    controller.signal.addEventListener('abort', abortHandler, {once: true});
    let stop = false;
    const promptIn: PromptObject = {
      ...comb.prompt as PromptObject<any>,
      stdin: this.process.stdin,
      stdout: this.process.stdout,
      onState: ({aborted}: {aborted: boolean  }) => {
        stop = aborted;
      },
    };
    const res = await prompts(promptIn, {
      onCancel: () => {
        this.logger.debug(`On cancel called for prompt ${combKey}`);
        stop = true;
      },
    });
    if (stop) {
      throw Error(`Aborting current operation ${combKey}`);
    }
    controller.signal.removeEventListener('abort', abortHandler);
    // eslint-disable-next-line guard-for-in
    for (const k in res) {
      this.configService.setVariable(k, res[k], true);
    }
  }
}

