import {Logger, Module, OnModuleInit} from '@nestjs/common';
import {ConfigService} from '@/config/config-service';
import * as process from 'node:process';
import {ConfigsPathService} from '@/config/configs-path.service';
import {ConfigReaderService} from '@/config/config-reader-service';
import {ConfigPathClass, ENV} from '@/config/types/config-path';
import {SAVE_TIMEOUT} from '@/config/config-model';

@Module({
  providers: [
    Logger,
    ConfigsPathService,
    {
      provide: ConfigPathClass,
      useExisting: ConfigsPathService,
    },
    {
      provide: SAVE_TIMEOUT,
      useValue: 1000, // 1s
    },
    ConfigReaderService,
    ConfigService,
    {
      provide: ENV,
      useValue: process.env,
    },
  ],
  exports: [ConfigService, ConfigPathClass],
})
export class ConfigModule implements OnModuleInit {
  constructor(private readonly configService: ConfigService) {
  }

  async onModuleInit(): Promise<void> {
    await this.configService.loadConfig();
  }
}
