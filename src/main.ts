import {NestFactory} from '@nestjs/core';
import {AppModule} from '@/app/app.module';
import {CustomLogger} from '@/app/custom-logger';
import * as process from 'node:process';
import {asyncLocalStorage} from '@/asyncstore/async-storage-value';
import {SemaphorService} from '@/semaphor/semaphor-service';
import path from 'path';
import yargs from 'yargs';
import type {AppConfig, ReloadRequest} from '@/app/app-model';
import net from 'net';

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
      .option('enable-api', {
        type: 'boolean',
        default: false,
      })
      .option('api-port', {
        type: 'number',
        default: 6000,
        description: 'if enable-api activates, exposes api on this port',
      })
      .implies('api-port', 'enable-api')
      .option('cert-dir', {
        type: 'string',
        default: path.join(commonDir, 'certs'),
        description: 'Directory that contains key.pem, cert.pem, ca-cert.pem for MTLS',
      })
      .parse();
}

async function isPortOpen(port: number, timeout = 2000): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();

    socket.setTimeout(timeout);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true); // port is open
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false); // port closed or unreachable
    });
    socket.on('error', () => {
      resolve(false); // port closed
    });

    socket.connect(port, '127.0.0.1');
  });
}

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
      customLogger.log(`hotkey-hub ${packageJson} is already running at port ${args.apiPort}`);
      const body: ReloadRequest = {
      };
      if (process.argv.some(arg => arg === '--config-file' || arg.startsWith('--config-file='))) {
        body.configFile = args.configFile;
      }
      if (process.argv.some(arg => arg === '--variables-file' || arg.startsWith('--variables-file='))) {
        body.variablesFile = args.variablesFile;
      }
      if (Object.keys(body).length === 0) {
        throw new Error(`hotkey-hub is already running at port ${args.apiPort}`);
      }
      const response = await fetch(`http://localhost:${args.apiPort}/reload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const errorText = await response.text(); // Use text() for error responses
        throw new Error(`Unable to reload config ${response.status}: ${errorText}`);
      }
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
