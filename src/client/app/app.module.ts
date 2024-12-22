import { Module } from '@nestjs/common';
import { AppController } from '@/client/app/app-controller';
import { KeyboardService } from '@/client/app/keyboard-service';
import { DevtoolsModule } from '@nestjs/devtools-integration'

@Module({
  imports: [
    DevtoolsModule.register({
      http: true,
      port: 8000,
    }),
  ],
  controllers: [AppController],
  providers: [KeyboardService],
})
export class AppModule {
}
