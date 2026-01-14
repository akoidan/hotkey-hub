import {Logger, Module, OnModuleInit} from '@nestjs/common';
import {ConfigModule} from '@/config/config-module';
import {RgbService} from '@/rgb/rgb-service';

@Module({
  imports: [ConfigModule],
  providers: [
    Logger,
    RgbService,
  ],
  exports: [RgbService],
})
export class RgbModule implements OnModuleInit {
  constructor(
    private readonly logger: Logger,
    private readonly rgbService: RgbService,
  ) {
  }

  public async onModuleInit(): Promise<void> {
    await this.rgbService.setup();
  }
}
