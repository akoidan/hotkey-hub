import type {AppConfig, YargsConfig} from '@/app/app-model';
import path, {basename} from 'path';
import yargs from 'yargs';
import net from 'net';
import http from 'http';
import type {LogLevel} from '@nestjs/common';
import process from 'node:process';
import {homedir} from 'os';
import type {Variables} from '@/config/types/variables';
import prompts from 'prompts';
import {promises as fs} from 'fs';
import {parse} from 'jsonc-parser';
import type {ConsoleLogger} from '@/app/console-logger.service';


function getTopDir(): string {
  let commonDir;
  if (process.platform === 'win32') {
    commonDir = process.env.APPDATA ?? path.join(homedir(), 'AppData', 'Roaming');
  } else if (process.platform === 'linux') {
    commonDir = process.env.XDG_CONFIG_HOME ?? path.join(homedir(), '.config');
  } else {
    throw new Error(`Unsupported platform: ${process.platform}`);
  }
  return path.join(commonDir, 'hotkey-hub');
}

async function promtConfigIfMissing(appArgs: string[], logger: ConsoleLogger, res: YargsConfig):Promise<AppConfig> {
  // eslint-disable-next-line sonarjs/no-duplicate-string
  let configProvided: boolean = appArgs.includes('config-file') || appArgs.some(f => f.startsWith('--config-file'));
  const variablesProvided: boolean = appArgs.includes('variables-file') || appArgs.some(f => f.startsWith('--variables-file'));
  if (!configProvided) {
    let varFile: string;
    try {
      varFile = await fs.readFile(res.variablesFile, 'utf8');
    } catch (e: any) {
      logger.warn(`Unable to parse variables file because of ${e?.message || e}`);
      return {...res, configProvided, variablesProvided};
    }
    const varFileContent: Variables = (parse(varFile) as Variables ?? {});
    if (Array.isArray(varFileContent.configPath) && varFileContent.configPath.length > 1) {
      logger.log('--config-file option was not provided, adding select options');
      const response = await prompts({
        type: 'select',
        // eslint-disable-next-line sonarjs/no-duplicate-string
        name: 'config-file',
        message: 'Select config file',
        choices: varFileContent.configPath.map(a => ({title: basename(a), value: a})),
      });
      // if ctrl+c is presssed it returns empty object
      if (!response['config-file']) {
        throw new Error('Config file selection was cancelled');
      }
      // eslint-disable-next-line
      res.configFile = response['config-file'];
      configProvided = true;
    }
  }
  return {...res, configProvided, variablesProvided};
}

async function parseArgs(logger: ConsoleLogger): Promise<AppConfig> {
  const commonDir = getTopDir();
  const logLevel: LogLevel[] = ['log' , 'error' , 'warn' , 'debug' , 'verbose' , 'fatal'] as LogLevel[];
  const appArgs = process.argv.slice(2);
  const res: YargsConfig = await yargs(appArgs)
      .strict()
      .scriptName('hotkey-hub')
      .epilog('Reffer https://github.com/akoidan/hotkey-hub for more documentation')
      .usage('Allows to control remote pc using OS hotkeys')
      .option('config-file', {
        type: 'string',
        default: path.join(commonDir, 'config.jsonc'),
        description: 'Configs that describes hotkey bindins',
        coerce: (input: string) => path.isAbsolute(input) ? input : path.resolve(process.cwd(), input),
      })
      .option('variables-file', {
        type: 'string',
        default: path.join(commonDir, 'variables.jsonc'),
        description: 'File that used to store permanent variables across restarts',
        coerce: (input: string) => path.isAbsolute(input) ? input : path.resolve(process.cwd(), input),
      })
      .option('log-level', {
        choices: logLevel,
        default: 'log',
        description: 'Log level. Set to debug to print more info',
      })
      .option('api-server', {
        type: 'boolean',
        default: false,
        description: 'Runs http server on localhost that allows reload config or variables via http api',
      })
      .option('api-port', {
        type: 'number',
        default: 6000,
        implies: 'api-server',
        description: 'if enable-api activates, exposes api on this port',
      })
      .option('cert-dir', {
        type: 'string',
        default: path.join(commonDir, 'certs'),
        description: 'Directory that contains key.pem, cert.pem, ca-cert.pem for MTLS',
      })
      .parse();
  return promtConfigIfMissing(appArgs, logger, res);
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


async function postLocalhost(body: unknown, urlPath: string, port: number): Promise<any> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);

    const options: http.RequestOptions = {
      hostname: '127.0.0.1', // use 127.0.0.1 instead of localhost
      port,
      path: urlPath,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', // eslint-disable-line @typescript-eslint/naming-convention
        'Content-Length': Buffer.byteLength(data), // eslint-disable-line @typescript-eslint/naming-convention
      },
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => (responseData += chunk));
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve(responseData);
        } else {
          try {
            const bodyObj = JSON.parse(responseData) as Error;
            reject(new Error(`Unable to apply new configuration. ${bodyObj.message}`));
          } catch (e: any) {
            reject(new Error(`Unable to apply new configuration. Unkown error ${responseData}`));
          }
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.write(data);
    req.end();
  });
}

export {postLocalhost, isPortOpen, parseArgs};