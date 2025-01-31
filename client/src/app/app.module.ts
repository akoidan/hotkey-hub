import {
  Logger,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import {AppController} from '@/app/app-controller';
import {KeyboardModule} from '@/keyboard/keyboard-module';
import {ExecuteModule} from '@/execute/execute-module';
import {MouseModule} from '@/mouse/mouse-module';
import {RequestIdMiddleware} from '@/app/request-id-middleware';

@Module({
  imports: [KeyboardModule, ExecuteModule, MouseModule],
  controllers: [AppController],
  providers: [Logger, RequestIdMiddleware],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
