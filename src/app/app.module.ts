import {DynamicModule, Logger, Module, OnModuleInit} from '@nestjs/common';
import {ConfigModule} from '@/config/config-module';
import {ClientModule} from '@/client/client-module';
import {LocalModule} from '@/local/local.module';
import {KeybindingService} from '@/local/keybinding-service';
import clc from 'cli-color';
import {ConfigService} from '@/config/config-service';
import {CERT_DIR} from '@/client/client-model';
import {CONFIG_FILE, MACROS_FILE, VARIABLES_FILE} from '@/config/config-model';
import {AppConfig} from '@/app/app-model';

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

  static forRoot(args: AppConfig): DynamicModule {
    return {
      module: AppModule,
      global: true,
      exports: [CERT_DIR, MACROS_FILE, VARIABLES_FILE, CONFIG_FILE],
      providers: [
        {provide: CERT_DIR, useValue: args.certDir},
        {provide: MACROS_FILE, useValue: args.macrosFile},
        {provide: VARIABLES_FILE, useValue: args.variablesFile},
        {provide: CONFIG_FILE, useValue: args.configFile},
      ],
    };
  }
}
