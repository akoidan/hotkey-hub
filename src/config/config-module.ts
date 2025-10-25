import {
  Logger,
  Module,
  OnModuleInit,
} from '@nestjs/common';
import {ConfigService} from '@/config/config-service';
import * as process from 'node:process';
import {ConfigsPathService} from '@/config/configs-path.service';
import {ConfigReaderService} from '@/config/config-reader-service';
import {ConfigPathClass, ENV} from '@/config/types/config-path';
import {VariableRefService} from '@/config/variable-ref.service';

@Module({
  providers: [
    Logger,
    VariableRefService,
    ConfigsPathService,
    {
      provide: ConfigPathClass,
      useExisting: ConfigsPathService,
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
