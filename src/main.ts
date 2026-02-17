import {NestFactory} from '@nestjs/core';
import {AppModule} from '@/app/app.module';
import {ConsoleLogger} from '@/app/console-logger.service';
import * as process from 'node:process';
import {asyncLocalStorage} from '@/asyncstore/async-storage-value';
import {SemaphorService} from '@/semaphor/semaphor-service';
import type {AppConfig, ReloadRequest} from '@/app/app-model';
import {isPortOpen, parseArgs, postLocalhost} from '@/app/utils';
import type {LogLevel} from '@nestjs/common';
import clc from 'cli-color';


asyncLocalStorage.run(
  new Map<string, any>()
    .set(SemaphorService.COMB_KEY, 'init')
    .set(SemaphorService.ABORT_CONTROLLER, new AbortController()),
    // eslint-disable-next-line max-lines-per-function
  () => {
    const logger = new ConsoleLogger(asyncLocalStorage);

    async function sendCommandToPort(args: AppConfig): Promise<void> {
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
      logger.log(`Applied new configuration ${JSON.stringify(body)} to already running hotkey-hub at port ${args.apiPort}`);
    }

    function procesError(err: unknown): void {
      logger.fatal(err as (string | Error), (err as Error)?.stack);
      if (process.platform === 'win32') {
        // Wait for user input before exiting
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.setEncoding('utf8');
        logger.log('Press any key to exit...');
        process.stdin.once('data', () => {
          process.exit(1);
        });
      } else {
        process.exit(1);
      }
    }

    (async function startApp(): Promise<void> {
      // eslint-disable-next-line
      const packageJson: string = require('../package.json').version;
      const args = await parseArgs();
      logger.setLogLevel(args.logLevel as LogLevel);
      const portOpen = await isPortOpen(args.apiPort);
      if (args.apiServer && portOpen) {
        throw Error(`Hotkey is already running at port ${args.apiPort}`);
      } else if (args.apiServer) {
        logger.log(`Started hotkey-hub ${clc.bold.green(packageJson)} initilaziation`);
        const app = await NestFactory.create(AppModule.forRoot(args), {logger});
        logger.log(`Starting hotkey-hub daemon api at port ${args.apiPort}`);
        await app.listen(args.apiPort, '127.0.0.1');
      } else if (portOpen) {
        await sendCommandToPort(args);
      } else {
        logger.log(`Started hotkey-hub v${clc.bold.green(packageJson)} initilaziation`);
        await NestFactory.createApplicationContext(AppModule.forRoot(args), {logger});
      }
    })().catch(procesError);
  }
);
