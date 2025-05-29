import {
  Logger,
  Module,
} from '@nestjs/common';
import {SemaphorService} from '@/semaphor/semaphor-service';
import {AsyncStorageModule} from '@/asyncstore/async-storage.module';
import {ConfigModule} from '@/config/config-module';
import {RgbModule} from '@/rgb/rgb.module';

@Module({
  imports: [AsyncStorageModule, ConfigModule],
  providers: [
    Logger,
    SemaphorService,
  ],
  exports: [SemaphorService],
})
export class SemaphorModule {

}
