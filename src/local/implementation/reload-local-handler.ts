import {Inject, Injectable, Logger} from '@nestjs/common';
import {BaseLocalHandler} from '@/local/base-local-handler';
import {ReloadConfigLocalCommand, UnknownCommand} from '@/config/types/local/local-commands';
import {ConfigPath, ConfigPathClass} from '@/config/types/config-path';
import {KeybindingService} from '@/local/keybinding-service';

@Injectable()
export class ReloadLocalHandler extends BaseLocalHandler {
  private keyBindingService: KeybindingService|null = null!;

  constructor(
    private readonly logger: Logger,
    @Inject(ConfigPathClass)
    private readonly configsPathService: ConfigPath,
  ) {
    super();
  }

  public setKeyBindingService(keyBindingService: KeybindingService): void {
    this.keyBindingService = keyBindingService;
  }

  canHandle(command: UnknownCommand): command is ReloadConfigLocalCommand {
    const cc = command as ReloadConfigLocalCommand;
    return typeof cc.reloadConfig !== 'undefined' || typeof cc.reloadMacro !== 'undefined' || typeof cc.reloadVariables !== 'undefined';
  }

  public async* execute(
    input: ReloadConfigLocalCommand,
  ): AsyncGenerator<void> {
    if (!this.keyBindingService) {
      throw Error('Module not loaded, keybinding service required');
    }
    this.configsPathService.setConfigPaths(input.reloadConfig, input.reloadMacro, input.reloadVariables);
    await this.keyBindingService.reloadShortcuts();
    yield undefined;
  }
}
