import {
  Logger,
  Module,
} from '@nestjs/common';
import {FetchClient} from '@/client/http-client';
import {ClientService} from '@/client/client-service';
import {CertService} from '@/client/cert-service';
import {ConfigModule} from '@/config/config-module';
import {ConfigService} from '@/config/config-service';
import {MutexService} from '@/mutex/mutex.service';
import {MutexModule} from '@/mutex/mutex.module';


@Module({
  imports: [
    ConfigModule,
    MutexModule,
  ],
  providers: [
    Logger,
    CertService,
    {
      provide: FetchClient,
      async useFactory(
        logger: Logger,
        cert: CertService,
        config: ConfigService,
        semaphore: MutexService,
      ): Promise<FetchClient> {
        return new FetchClient(logger, config, await cert.getHttpAgent(), 'https:', semaphore);
      },
      inject: [Logger, CertService, ConfigService, MutexService],
    },
    ClientService,
  ],
  exports: [ClientService],
})
export class ClientModule {
}
