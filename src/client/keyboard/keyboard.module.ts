import { Module } from '@nestjs/common';
import { KeyboardController } from '@/client/keyboard/keyboard-controller';
import { KeyboardService } from '@/client/keyboard/keyboard-service';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        transport: {
          target: 'pino-pretty',
          options: {
            singleLine: true,
          },
        },
      },
    }),
  ],
  controllers: [KeyboardController],
  providers: [
    KeyboardService,
  ],
})
export class KeyboardModule {}
