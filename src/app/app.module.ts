// eslint-disable-next-line max-classes-per-file
import {DynamicModule, Logger, Module, OnModuleInit} from '@nestjs/common';
import {ConfigModule} from '@/config/config-module';
import {ClientModule} from '@/client/client-module';
import {LocalModule} from '@/local/local.module';
import {KeybindingService} from '@/local/keybinding-service';
import clc from 'cli-color';
import {ConfigService} from '@/config/config-service';
import {CERT_DIR} from '@/client/client-model';
import {CONFIG_DIR} from '@/config/config-model';

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

  static forRoot(certDir: string, configDir: string): DynamicModule {
    return {
      module: AppModule,
      global: true,
      exports: [CERT_DIR, CONFIG_DIR],
      providers: [
        {
          provide: CERT_DIR,
          useValue: certDir,
        },
        {
          provide: CONFIG_DIR,
          useValue: configDir,
        },
      ],
    };
  }
}
