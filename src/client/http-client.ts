import {Inject, Injectable, Logger} from '@nestjs/common';
import {Agent, request} from 'https';
import {ConfigService} from '@/config/config-service';
import clc from 'cli-color';
import {SemaphorService} from '@/semaphor/semaphor-service';
import {ASYNC_PROVIDER} from '@/asyncstore/async-storage-const';
import {AsyncLocalStorage} from 'async_hooks';
import {CustomError, RequestOptions, TIMEOUT} from '@/client/client-model';


@Injectable()
export class FetchClient {
  constructor(
    private readonly logger: Logger,
    private readonly config: ConfigService,
    private readonly agent: Agent,
    private readonly semaphorService: SemaphorService,
    @Inject(TIMEOUT)
    private readonly timeout: number,
    @Inject(ASYNC_PROVIDER)
    private readonly asyncLocalStorage: AsyncLocalStorage<Map<string, any>>,
  ) {
  }

  // eslint-disable-next-line max-lines-per-function
  private async executeRequest(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    client: string,
    url: string,
    payloadstr: string | null,
    controller: AbortController
  ): Promise<[string, number]> {
    const ips = this.config.getIps();
    let host = ips[client];
    let port: number;
    if (host.includes(':')) {
      [host] = host.split(':');
      port = parseInt(host.split(':')[1], 10);
    } else {
      port = this.config.getClientPort();
    }
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
        port,
        host,
        signal: controller.signal,
        protocol: 'https:',
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

      if (payloadstr) {
        req.write(payloadstr);
      }
      this.logger.debug(`Executing ${method} https://${host}:${port}${url} ${payloadstr ?? ''}`);
      req.end();
    });
  }

  private getHeaders(payloadstr: string | null): Record<string, string | number> {
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

  // eslint-disable-next-line max-lines-per-function
  private async makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    client: string,
    url: string,
    options: RequestOptions = {},
  ): Promise<T> {
    const payloadstr: string | null = options.payload ? JSON.stringify(options.payload) : null;
    if (options.query) {
      url += `?${new URLSearchParams(options.query).toString()}`;
    }
    try {
      const httpController = new AbortController(); // otherwise it will fail all commands
      let timeout: NodeJS.Timeout | null = null;
      let reject: ((error: Error) => void) |null = null ;
      const controller = this.asyncLocalStorage.getStore()?.get(SemaphorService.ABORT_CONTROLLER) as AbortController;
      const combKey  = this.asyncLocalStorage.getStore()!.get(SemaphorService.COMB_KEY) as string;
      const eventListener = (): void =>  {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        this.logger.debug(`Aborting request ${combKey}, and clearing timeout ${timeout}`);
        clearTimeout(timeout!);
        httpController.abort();
        reject!(Error(controller.signal.reason as string));
      };
      const [result, statusCode] = await Promise.race([
        this.executeRequest(method, client, url, payloadstr, httpController),
        new Promise<never>((_, innerReject) => {
          reject = innerReject;
          timeout = setTimeout(() => {
            this.logger.debug(`Request timed out after ${this.timeout}ms`);
            controller.signal.removeEventListener('abort', eventListener);
            httpController.abort();
            innerReject(Error(`Request timed out after ${this.timeout}ms`));
          }, options.timeout ?? this.timeout);
          // eslint-disable-next-line
          this.logger.verbose(`Added timeout ${timeout}`);
          controller.signal.addEventListener('abort', eventListener);
        }),
      ]);
      controller.signal.removeEventListener('abort', eventListener);
      clearTimeout(timeout!);

      this.logger.log(
        `${method}:${statusCode} ${clc.bold.green(client)} ${clc.yellow(url)} ` +
        `${payloadstr ?? ''} ${clc.xterm(7)('==>>')} ${result || 'void'}`
      );
      if ((statusCode as unknown as number) !== 204 && result) {
        try {
          return JSON.parse(result) as T;
        } catch (error) {
          throw new Error(`Failed to parse ${result}`);
        }
      }
      return null as T;
    } catch (error: unknown) {
      const status: number | 'FAIL' = (error as CustomError).statusCode ?? 'FAIL';
      let hostname = this.config.getIps()[client];
      if (!hostname.includes(':')) {
        hostname = `${hostname}:${this.config.getClientPort()}`;
      }
      const fullUrl: string = `https://${hostname}${url}`;
      throw new Error(
        `${method}:${client}:${status} ${fullUrl} ${(error as Error).message}`
        + ` ${payloadstr ?? ''} ${clc.xterm(2)('==>>')} ${(error as CustomError).response ?? 'void'}`
      );
    }
  }

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  async post<T>(client: string, url: string, options: RequestOptions = {}): Promise<T> {
    return this.makeRequest<T>('POST', client, url, options);
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  async patch<T>(client: string, url: string, options: RequestOptions = {}): Promise<T> {
    return this.makeRequest<T>('PATCH', client, url, options);
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  async put<T>(client: string, url: string, options: RequestOptions = {}): Promise<T> {
    return this.makeRequest<T>('PUT', client, url, options);
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  async delete<T>(client: string, url: string, options: RequestOptions = {}): Promise<T> {
    return this.makeRequest<T>('DELETE', client, url, options);
  }

  async get<T>(client: string, url: string, options: RequestOptions = {}): Promise<T> {
    return this.makeRequest<T>('GET', client, url, options);
  }
}
