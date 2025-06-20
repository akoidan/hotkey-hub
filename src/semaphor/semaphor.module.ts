import {Logger, Module} from '@nestjs/common';
import {SemaphorService} from '@/semaphor/semaphor-service';
import {AsyncStorageModule} from '@/asyncstore/async-storage.module';

@Module({
  imports: [AsyncStorageModule],
  providers: [
    Logger,
    SemaphorService,
  ],
  exports: [SemaphorService],
})
export class SemaphorModule {

}
