import {DynamicModule, Logger, Module, OnModuleInit} from '@nestjs/common';
import {ConfigModule} from '@/config/config-module';
import {ClientModule} from '@/client/client-module';
import {LocalModule} from '@/local/local.module';
import {CERT_DIR} from '@/client/client-model';
import {CONFIG_FILE, VARIABLES_FILE} from '@/config/config-model';
import {AppConfig, LOG_LEVEL, VERSION_INJ} from '@/app/app-model';
import {StartService} from '@/app/start.service';
import {AppController} from '@/app/app.controller';

@Module({
  imports: [ConfigModule, ClientModule, LocalModule],
  providers: [Logger, StartService],
  controllers: [AppController],
  exports: [],
})
export class AppModule implements OnModuleInit {
  constructor(
    private readonly appService: StartService,
  ) {
  }

  async onModuleInit(): Promise<void> {
    await this.appService.init();
  }

  static forRoot(args: AppConfig): DynamicModule {
    return {
      module: AppModule,
      global: true,
      exports: [CERT_DIR, VARIABLES_FILE, CONFIG_FILE, LOG_LEVEL, VERSION_INJ],
      providers: [
        {
          provide: VERSION_INJ,
          // eslint-disable-next-line
          useValue: require('../../package.json').version,
        },
        {provide: LOG_LEVEL, useValue: args.logLevel},
        {provide: CERT_DIR, useValue: args.certDir},
        {provide: VARIABLES_FILE, useValue: args.variablesFile},
        {provide: CONFIG_FILE, useValue: args.configFile},
      ],
    };
  }
}
