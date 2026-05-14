import {Logger, Module, OnModuleDestroy, OnModuleInit} from '@nestjs/common';
import {ConfigModule} from '@/config/config-module';
import {RgbService} from '@/rgb/rgb-service';
import {NativeModule} from '@/native/native-module';

@Module({
  imports: [ConfigModule, NativeModule],
  providers: [
    Logger,
    RgbService,
  ],
  exports: [RgbService],
})
export class RgbModule implements OnModuleInit, OnModuleDestroy {
  constructor(
    private readonly logger: Logger,
    private readonly rgbService: RgbService,
  ) {
  }

  public onModuleInit(): void {
    // this should not throw, and process asyncrhoously
    void this.rgbService.setup();
  }

  public onModuleDestroy(): void {
    this.rgbService.teardown();
  }
}
