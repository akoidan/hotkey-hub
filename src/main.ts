import {NestFactory} from '@nestjs/core';
import {AppModule} from '@/app/app.module';
import {CustomLogger} from '@/app/custom-logger';
import * as process from 'node:process';
import {asyncLocalStorage} from '@/asyncstore/async-storage-value';
import {SemaphorService} from '@/semaphor/semaphor-service';
import type {ReloadRequest} from '@/app/app-model';
import {isPortOpen, parseArgs, postLocalhost} from '@/app/utils';



asyncLocalStorage.run(new Map<string, string>().set(SemaphorService.COMB_KEY, 'init'), () => {
  const customLogger = new CustomLogger(asyncLocalStorage);
  (async function startApp(): Promise<void> {
    // eslint-disable-next-line
    const packageJson: string = require('../package.json').version;
    const args = await parseArgs();
    if (args.enableApi) {
      customLogger.log(`Initializing hotkey-hub ${packageJson} ...`);
      const app = await NestFactory.create(
        AppModule.forRoot(args),
        {
          logger: customLogger,
        }
      );
      customLogger.log(`Starting hotkey-hub ${packageJson} at prt ${args.apiPort}`);
      await app.listen(args.apiPort, '127.0.0.1');
    } else if (await isPortOpen(args.apiPort)) {
      const body: ReloadRequest = {};
      if (process.argv.some(arg => arg === '--config-file' || arg.startsWith('--config-file='))) {
        body.configFile = args.configFile;
      }
      if (process.argv.some(arg => arg === '--variables-file' || arg.startsWith('--variables-file='))) {
        body.variablesFile = args.variablesFile;
      }
      if (Object.keys(body).length === 0) {
        throw new Error(`hotkey-hub is already running at port ${args.apiPort}`);
      }
      await postLocalhost(body, '/reload', args.apiPort);
      customLogger.log(`Applied new configuration ${JSON.stringify(body)} to already running hotkey-hub at port ${args.apiPort}`);
    } else {
      customLogger.log(`Initializing hotkey-hub ${packageJson} ...`);
      await NestFactory.createApplicationContext(
        AppModule.forRoot(args),
        {
          logger: customLogger,
        }
      );
    }
  })().catch((err: unknown) => {
    customLogger.error(err as (string | Error), (err as Error)?.stack);
    process.exit(1);
  });
});
