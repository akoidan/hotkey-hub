import type {AppConfig} from '@/app/app-model';
import path from 'path';
import yargs from 'yargs';
import net from 'net';
import http from 'http';

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
          } catch (e) {
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