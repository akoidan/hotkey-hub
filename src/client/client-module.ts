import {
  Logger,
  Module,
} from '@nestjs/common';
import {FetchClient} from '@/client/http-client';
import {ClientService} from '@/client/client-service';
import {CertService} from '@/client/cert-service';
import {ConfigModule} from '@/config/config-module';
import {ConfigService} from '@/config/config-service';
import {ASYNC_PROVIDER} from '@/asyncstore/async-storage-const';
import {AsyncStorageModule} from '@/asyncstore/async-storage.module';
import {AsyncLocalStorage} from 'async_hooks';
import {SemaphorService} from '@/semaphor/semaphor-service';
import {SemaphorModule} from '@/semaphor/semaphor.module';


@Module({
  imports: [
    ConfigModule,
    SemaphorModule,
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
