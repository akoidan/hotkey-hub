import {Logger, Module} from '@nestjs/common';
import {FetchClient} from '@/client/http-client';
import {ClientService} from '@/client/client-service';
import {CertService} from '@/client/cert-service';
import {ConfigModule} from '@/config/config-module';
import {SemaphorModule} from '@/semaphor/semaphor.module';
import {KeyboardService} from '@/client/services/keyboard.service';
import {MonitorService} from '@/client/services/monitor.service';
import {MouseService} from '@/client/services/mouse.service';
import {ProcessService} from '@/client/services/process.service';
import {WindowService} from '@/client/services/window.service';
import {Agent} from 'https';
import {AsyncStorageModule} from '@/asyncstore/async-storage.module';
import {AppService} from '@/client/services/app.service';


@Module({
  imports: [
    ConfigModule,
    AsyncStorageModule,
    SemaphorModule,
  ],
  providers: [
    Logger,
    AppService,
    KeyboardService,
    MonitorService,
    MouseService,
    ProcessService,
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
