import {Inject, Injectable, Logger} from '@nestjs/common';
import {KeybindingService} from '@/local/keybinding-service';
import clc from 'cli-color';
import {ConfigService} from '@/config/config-service';
import {ReloadRequest} from '@/app/app-model';
import {ConfigPath, ConfigPathClass} from '@/config/types/config-path';
import {INativeModule, Native} from '@/native/native-model';

@Injectable()
export class StartService {
  constructor(
      private readonly logger: Logger,
      private readonly keybindingService: KeybindingService,
      private readonly configService: ConfigService,
      @Inject(ConfigPathClass)
      private readonly configsPathService: ConfigPath,
      @Inject(Native)
      private readonly native: INativeModule
  ) {
  }

  async destroy(): Promise<void> {
    this.logger.debug('Destroying app...');
    await this.keybindingService.unregisterShortcuts();
    this.native.setWindowTitle('Hotkey-hub');
  }

  async init(): Promise<void> {
    this.logger.debug('Initializing app...');
    await this.keybindingService.registerShortcuts();
    const shortcuts = this.configService.getCombinations().map(a => a.shortCut);
    if (shortcuts.length === 0) {
      throw Error('No shortcuts found. App will exist due to no listener');
    }
    this.native.setWindowTitle(this.configService.getName());
    this.logger.log(`App has successfully started with following shortcuts: ${clc.bold.green(shortcuts.join(' '))}`);
  }

  async reload(reload: ReloadRequest): Promise<void> {
    this.logger.debug(`Reloading config hotkey config from ${JSON.stringify(reload)}...`);
    this.configsPathService.setConfigPaths(reload.configFile, reload.variablesFile);
    await this.keybindingService.reloadShortcuts();
    this.native.setWindowTitle(this.configService.getName());
    this.logger.log(`Loaded new config from ${JSON.stringify(reload)}`);
  }
}
