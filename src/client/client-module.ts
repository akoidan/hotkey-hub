import {
  Logger,
  Module,
} from '@nestjs/common';
import { FetchClient } from '@/client/http-client';
import { ClientService } from '@/client/client-service';
import { CertService } from '@/client/cert-service';
import { ConfigModule } from '@/config/config-module';
import { ConfigService } from '@/config/config-service';
import { ASYNC_PROVIDER } from '@/asyncstore/async-storage-const';
import { AsyncStorageModule } from '@/asyncstore/async-storage.module';
import { AsyncLocalStorage } from 'async_hooks';


@Module({
  imports: [
    ConfigModule,
    AsyncStorageModule,
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
        async: AsyncLocalStorage<Map<string, any>>
      ): Promise<FetchClient> {
        return new FetchClient(logger, config, await cert.getHttpAgent(), 'https:', async);
      },
      inject: [Logger, CertService, ConfigService, ASYNC_PROVIDER],
    },
    ClientService,
  ],
  exports: [ClientService],
})
export class ClientModule {
}
