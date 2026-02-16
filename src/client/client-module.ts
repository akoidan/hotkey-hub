import {Logger, Module} from '@nestjs/common';
import {FetchClient} from '@/client/http-client';
import {ClientService} from '@/client/client-service';
import {CertService} from '@/client/cert-service';
import {ConfigModule} from '@/config/config-module';
import {SemaphorModule} from '@/semaphor/semaphor.module';
import {PingService} from '@/client/services/ping.service';
import {KeyboardService} from '@/client/services/keyboard.service';
import {MonitorService} from '@/client/services/monitor.service';
import {MouseService} from '@/client/services/mouse.service';
import {ProcessService} from '@/client/services/process.service';
import {WindowService} from '@/client/services/window.service';
import {TIMEOUT} from '@/client/client-model';
import {Agent} from 'https';
import {AsyncStorageModule} from '@/asyncstore/async-storage.module';


@Module({
  imports: [
    ConfigModule,
    AsyncStorageModule,
    SemaphorModule,
  ],
  providers: [
    Logger,
    PingService,
    KeyboardService,
    MonitorService,
    MouseService,
    ProcessService,
    {
      provide: TIMEOUT,
      useValue: 30000,
    },
    {
      provide: Agent,
      inject: [CertService],
      useFactory: async(cert: CertService): Promise<Agent> => {
        return cert.getHttpAgent();
      },
    },
    WindowService,
    CertService,
    FetchClient,
    ClientService,
  ],
  exports: [ClientService],
})
export class ClientModule {
}
