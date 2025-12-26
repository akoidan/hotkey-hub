import {NestFactory} from '@nestjs/core';
import {AppModule} from '@/app/app.module';
import {CustomLogger} from '@/app/custom-logger';
import * as process from 'node:process';
import {asyncLocalStorage} from '@/asyncstore/async-storage-value';
import {SemaphorService} from '@/semaphor/semaphor-service';
import path from 'path';
import yargs from 'yargs';

// eslint-disable-next-line @typescript-eslint/naming-convention
async function parseArgs(): Promise<{ configDir: string, certDir: string }> {
  const isNodeJs = process.execPath.endsWith('node') || process.execPath.endsWith('node.exe');
  const commonDir = isNodeJs ? process.cwd() : path.dirname(process.execPath);

  return yargs(process.argv.slice(2))
      .strict()
      .scriptName('hotkey-hub')
      .epilog('Reffer https://github.com/akoidan/hotkey-hub for more documentation')
      .usage('Allows to control remote pc using OS hotkeys')
      .option('config-dir', {
        type: 'string',
        default: path.join(commonDir, 'configs'),
        description: 'Directory that contains configs: config.jsonc, macros.jsonc, variables.jsonc',
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
    const {configDir, certDir} = await parseArgs();
    await NestFactory.createApplicationContext(AppModule.forRoot(certDir, configDir), {logger: customLogger});
  })().catch((err: unknown) => {
    customLogger.error(err as (string | Error), (err as Error)?.stack);
    process.exit(1);
  });
});
