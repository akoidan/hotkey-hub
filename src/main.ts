import {NestFactory} from '@nestjs/core';
import {AppModule} from '@/app/app.module';
import {CustomLogger} from '@/app/custom-logger';
import * as process from 'node:process';
import {asyncLocalStorage} from '@/asyncstore/async-storage-value';
import {SemaphorService} from '@/semaphor/semaphor-service';
import path from 'path';
import yargs from 'yargs';
import type {AppConfig} from '@/app/app-model';

// eslint-disable-next-line @typescript-eslint/naming-convention
async function parseArgs(): Promise<AppConfig> {
  const isNodeJs = process.execPath.endsWith('node') || process.execPath.endsWith('node.exe');
  const commonDir = isNodeJs ? process.cwd() : path.dirname(process.execPath);

  return yargs(process.argv.slice(2))
      .strict()
      .scriptName('hotkey-hub')
      .epilog('Reffer https://github.com/akoidan/hotkey-hub for more documentation')
      .usage('Allows to control remote pc using OS hotkeys')
      .option('config-file', {
        type: 'string',
        default: path.join(commonDir, 'configs', 'config.jsonc'),
        description: 'Configs that describes hotkey bindins',
      })
      .option('variables-file', {
        type: 'string',
        default: path.join(commonDir, 'configs', 'variables.jsonc'),
        description: 'File that used to store permanent variables across restarts',
      })
      .option('cert-dir', {
        type: 'string',
        default: path.join(commonDir, 'certs'),
        description: 'Directory that contains key.pem, cert.pem, ca-cert.pem for MTLS',
      })
      .parse();
}

asyncLocalStorage.run(new Map<string, string>().set(SemaphorService.COMB_KEY, 'init'), () => {
  const customLogger = new CustomLogger(asyncLocalStorage);
  (async function startApp(): Promise<void> {
    // eslint-disable-next-line
    const packageJson: string = require('../package.json').version;
    customLogger.log(`Initializing hotkey-hub ${packageJson} ...`);
    const args = await parseArgs();
    await NestFactory.createApplicationContext(
      AppModule.forRoot(args),
      {
        logger: customLogger,
      }
    );
  })().catch((err: unknown) => {
    customLogger.error(err as (string | Error), (err as Error)?.stack);
    process.exit(1);
  });
});
