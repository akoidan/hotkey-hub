import {
  Injectable,
  Logger,
} from '@nestjs/common';
import {
  Agent,
  request,
} from 'https';


interface CustomError extends Error {
  statusCode?: number;
  response?: string;
}

@Injectable()
export class FetchClient {
  constructor(
    private readonly logger: Logger,
    private readonly agent: Agent,
    private readonly protocol: string,
    private readonly port: number,
  ) {
  }

  // eslint-disable-next-line
  async post<T>(client: string, url: string, payload: any, timeout = 3000, withParse: boolean = false): Promise<T> {
    const payloadstr: string = JSON.stringify(payload);
    try {
      const [result, statusCode] = await new Promise<[string, number]>((resolve, reject) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          const error = Error(`Request timed out after ${timeout}m`);
          reject(error);
          controller.abort();
        }, timeout);
        const req = request({
          agent: this.agent,
          port: this.port,
          host: client,
          protocol: this.protocol,
          path: url,
          signal: controller.signal,
          headers: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'Content-Type': 'application/json',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'Content-Length': Buffer.byteLength(payloadstr),
          },
          method: 'POST',
        }, (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            clearTimeout(timeoutId);
            if (res.statusCode! < 400) {
              resolve([data, res.statusCode!]);
            } else {
              const error = Error();
              (error as CustomError).statusCode = res.statusCode;
              (error as CustomError).response = data;
              reject(error);
            }
          });
          res.on('error', (e) => {
            clearTimeout(timeoutId);
            reject(e);
          });
        });

        req.write(payloadstr);
        req.end();
      });
      this.logger.log(`POST:${statusCode} ${client}${url} ${payloadstr} ==>> ${result}`);
      if (withParse) {
        try {
          return JSON.parse(result) as T;
        } catch (error) {
          throw new Error(`Failed to parse ${result}`);
        }
      }
      return null as T;
    } catch (error: unknown) {
      const status = (error as CustomError).statusCode ?? 'FAIL';
      const fullUrl = `${this.protocol}//${client}:${this.port}${url}`;
      throw new Error(`POST:${status} ${fullUrl} ${(error as any).message}  ${payloadstr} ==>> ${(error as CustomError).response ?? ''}`);
    }
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  async get(client: string, url: string, timeout = 3000): Promise<void> {
    try {
      const result = await new Promise<string>((resolve, reject) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          reject(Error(`Request timed out after ${timeout}m`));
          controller.abort();
        }, timeout);
        const req = request({
          agent: this.agent,
          port: this.port,
          protocol: this.protocol,
          host: client,
          path: url,
          signal: controller.signal,
          method: 'GET',
        }, (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            clearTimeout(timeoutId);
            if (res.statusCode! < 400) {
              resolve(data);
            } else {
              reject(Error(`status code ${res.statusCode} ${data}`));
            }
          });
        });
        req.on('error', (e) => {
          clearTimeout(timeoutId);
          reject(e);
        });
        req.end();
      });

      this.logger.debug(`GET:OK ${this.protocol}//${client}:${this.port}${url} ${result}`);
    } catch (error: unknown) {
      throw new Error(`GET:FAIL ${this.protocol}//${client}:${this.port}${url} ${(error as any).message}`);
    }
  }
}
