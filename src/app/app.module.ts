import {Logger, Module, OnModuleInit} from '@nestjs/common';
import {ConfigModule} from '@/config/config-module';
import {ClientModule} from '@/client/client-module';
import {LocalModule} from '@/local/local.module';
import {KeybindingService} from '@/local/keybinding-service';
import clc from 'cli-color';
import {ConfigService} from '@/config/config-service';

@Module({
  imports: [ConfigModule, ClientModule, LocalModule],
  providers: [Logger],
  exports: [],
})
export class AppModule implements OnModuleInit {
  constructor(
    private readonly logger: Logger,
    private readonly keybindingService: KeybindingService,
    private readonly configService: ConfigService,
  ) {
  }

  async onModuleInit(): Promise<void> {
    this.logger.debug('Initializing app...');
    await this.keybindingService.registerShortcuts();
    const shortcuts = this.configService.getCombinations().map(a => a.shortCut);
    this.logger.log(`App has successfully started with following shortcuts: ${clc.bold.green(shortcuts.join(' '))}`);
  }
}
