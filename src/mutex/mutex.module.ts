import {
  Logger,
  Module,
} from '@nestjs/common';
import {MutexService} from '@/mutex/mutex.service';
import {AsyncStorageModule} from '@/asyncstore/async-storage.module';
import {ConfigModule} from '@/config/config-module';

@Module({
  imports: [AsyncStorageModule, ConfigModule],
  providers: [
    Logger,
    MutexService,
  ],
  exports: [MutexService],
})
export class MutexModule {

}
