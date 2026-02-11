import {Injectable, Logger} from '@nestjs/common';
import {Agent, request} from 'https';
import {ConfigService} from '@/config/config-service';
import clc from 'cli-color';
import {SemaphorService} from '@/semaphor/semaphor-service';

interface CustomError extends Error {
  statusCode?: number;
  response?: string;
}


@Injectable()
export class FetchClient {
  constructor(
    private readonly logger: Logger,
    private readonly config: ConfigService,
    private readonly agent: Agent,
    private readonly protocol: string,
    private readonly semaphorService: SemaphorService,
  ) {
  }

  // eslint-disable-next-line max-lines-per-function
  private async executeRequest(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    client: string,
    url: string,
    payloadstr: string,
    controller: AbortController
  ): Promise<[string, number]> {
    const ips = this.config.getIps();
    const host = ips[client];
    if (!host) {
      const error = Error();
      (error as CustomError).statusCode = 1;
      (error as CustomError).response = `Desination "${client}" doesn't exist. Available are ${JSON.stringify(ips)}`;
      throw error;
    }
    return new Promise<[string, number]>((resolve, reject) => {
      const headers = this.getHeaders(payloadstr);
      const req = request({
        agent: this.agent,
        port: this.config.getClientPort(),
        host,
        signal: controller.signal,
        protocol: this.protocol,
        path: url,
        method,
        headers,
      }, (res) => {
        let data = '';
        res.on('data', (chunk: string) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode! < 400) {
            resolve([data, res.statusCode!]);
          } else {
            const error = Error();
            (error as CustomError).statusCode = res.statusCode;
            (error as CustomError).response = data;
            reject(error);
          }
        });
        res.on('error', (error: Error) => reject(error));
      });

      if (method === 'POST' && payloadstr) {
        req.write(payloadstr);
      }
      req.end();
    });
  }

  private getHeaders(payloadstr: string): Record<string, string|number> {
    let headers: Record<string, string | number> = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      'x-request-id': this.semaphorService.getCurrentOperationId(),
    };
    if (payloadstr) {
      headers = {
        ...headers,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'Content-Type': 'application/json',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'Content-Length': Buffer.byteLength(payloadstr),
      };
    }
    return headers;
  }

  private async makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    client: string,
    url: string,
    payload?: unknown,
  ): Promise<T> {
    const payloadstr: string = payload ? JSON.stringify(payload) : '';

    try {
      const controller = new AbortController();
      const [result, statusCode] = await Promise.race([
        this.executeRequest(method, client, url, payloadstr, controller),
        new Promise<never>((_, reject) => {
          setTimeout(() => {
            controller.abort();
            reject(Error(`Request timed out after ${6000}m`));
          }, 6000);
        }),
      ]);

      this.logger.log(
        `${method}:${statusCode} ${clc.bold.green(client)} ${clc.yellow(url)} ${payloadstr ?? ''} ${clc.xterm(7)('==>>')} ${result}`
      );
      if (statusCode !== 204 && result) {
        try {
          return JSON.parse(result) as T;
        } catch (error) {
          throw new Error(`Failed to parse ${result}`);
        }
      }
      return null as T;
    } catch (error: unknown) {
      const status: number | 'FAIL' = (error as CustomError).statusCode ?? 'FAIL';
      const fullUrl: string = `${this.protocol}//${this.config.getIps()[client]}:${this.config.getClientPort()}${url}`;
      throw new Error(
        `${method}:${client}:${status} ${fullUrl} ${(error as Error).message}`
        +` ${payloadstr ?? ''} ${clc.xterm(2)('==>>')} ${(error as CustomError).response ?? ''}`
      );
    }
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  async post<T>(client: string, url: string, payload?: any): Promise<T> {
    return this.makeRequest<T>('POST', client, url, payload);
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  async patch<T>(client: string, url: string, payload?: any): Promise<T> {
    return this.makeRequest<T>('PATCH', client, url, payload);
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  async put<T>(client: string, url: string, payload?: any): Promise<T> {
    return this.makeRequest<T>('PUT', client, url, payload);
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  async delete<T>(client: string, url: string, payload?: any): Promise<T> {
    return this.makeRequest<T>('DELETE', client, url, payload);
  }

  async get<T>(client: string, url: string): Promise<T> {
    return this.makeRequest<T>('GET', client, url, undefined);
  }
}
