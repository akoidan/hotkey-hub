import { Module } from '@nestjs/common';
import { AppController } from '@/client/app/app.controller';
import { AppService } from '@/client/app/app.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
