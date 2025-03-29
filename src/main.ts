import {NestFactory} from '@nestjs/core';
import {AppModule} from '@/app/app.module';
import {CustomLogger} from '@/app/custom-logger';
import * as process from 'node:process';
import {asyncLocalStorage} from '@/asyncstore/async-storage-value';


asyncLocalStorage.run(new Map<string, string>().set('comb', 'init'), () => {
  const customLogger = new CustomLogger(asyncLocalStorage);
  NestFactory.createApplicationContext(AppModule, {
    logger: customLogger,
  }).catch((err: unknown) => {
    customLogger.error((err as Error)?.message ?? err, (err as Error)?.stack);
    process.exit(1);
  });
});
