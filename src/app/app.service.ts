import {Inject, Injectable, Logger} from '@nestjs/common';
import {KeybindingService} from '@/local/keybinding-service';
import clc from 'cli-color';
import {ConfigService} from '@/config/config-service';
import {ReloadRequest} from '@/app/app-model';
import {ConfigPath, ConfigPathClass} from "@/config/types/config-path";

@Injectable()
export class AppService {
  constructor(
      private readonly logger: Logger,
      private readonly keybindingService: KeybindingService,
      private readonly configService: ConfigService,
      @Inject(ConfigPathClass)
      private readonly configsPathService: ConfigPath,
  ) {
  }

  async init(): Promise<void> {
    this.logger.debug('Initializing app...');
    await this.keybindingService.registerShortcuts();
    const shortcuts = this.configService.getCombinations().map(a => a.shortCut);
    this.logger.log(`App has successfully started with following shortcuts: ${clc.bold.green(shortcuts.join(' '))}`);
  }

  async reload(reload: ReloadRequest): Promise<void> {
    this.configsPathService.setConfigPaths(reload.configFile, reload.variablesFile);
    await this.keybindingService.reloadShortcuts();
  }
}
