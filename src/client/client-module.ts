import {Logger, Module} from '@nestjs/common';
import {FetchClient} from '@/client/http-client';
import {ClientService} from '@/client/client-service';
import {CertService} from '@/client/cert-service';
import {ConfigModule} from '@/config/config-module';
import {ConfigService} from '@/config/config-service';
import {SemaphorService} from '@/semaphor/semaphor-service';
import {SemaphorModule} from '@/semaphor/semaphor.module';
import {PingService} from '@/client/services/ping.service';
import {KeyboardService} from '@/client/services/keyboard.service';
import {MonitorService} from '@/client/services/monitor.service';
import {MouseService} from '@/client/services/mouse.service';
import {ProcessService} from '@/client/services/process.service';
import {WindowService} from '@/client/services/window.service';


@Module({
  imports: [
    ConfigModule,
    SemaphorModule,
  ],
  providers: [
    Logger,
    PingService,
    KeyboardService,
    MonitorService,
    MouseService,
    ProcessService,
    WindowService,
    CertService,
    {
      provide: FetchClient,
      async useFactory(
        logger: Logger,
        cert: CertService,
        config: ConfigService,
        semaphore: SemaphorService,
      ): Promise<FetchClient> {
        return new FetchClient(logger, config, await cert.getHttpAgent(), 'https:', semaphore);
      },
      inject: [Logger, CertService, ConfigService, SemaphorService],
    },
    ClientService,
  ],
  exports: [ClientService],
})
export class ClientModule {
}
