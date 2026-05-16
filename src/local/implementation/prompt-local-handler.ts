import {Inject, Injectable, Logger} from '@nestjs/common';
import {BaseLocalHandler} from '@/local/base-local-handler';
import {UnknownCommand} from '@/config/types/commands';
import {SemaphorService} from '@/semaphor/semaphor-service';
import {EvaluateService} from '@/local/evaluate-serivce';
import {PromptLocalCommand} from '@/config/types/local/prompt-local-command';
import prompts from 'prompts';
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
    combDelayAfter: undefined | number,
    combDelayBefore: undefined | number,
    tId: string | undefined | null,
  ): Promise<void> {
    const controller: AbortController = this.asyncLocalStorage.getStore()!.get(SemaphorService.ABORT_CONTROLLER) as AbortController;
    const combKey  = this.asyncLocalStorage.getStore()!.get(SemaphorService.COMB_KEY) as string;


    const abortHandler = (): void => {
      this.logger.debug(`Aborting current operation ${combKey}`);
      this.process.stdin.pause();
      this.process.stdin.emit('end');
    };

    controller.signal.addEventListener('abort', abortHandler, {once: true});
    const res = await prompts(comb.prompt as any);
    controller.signal.removeEventListener('abort', abortHandler);
    this.configService.setVariable(comb.assignVariable, res)

  }
}

