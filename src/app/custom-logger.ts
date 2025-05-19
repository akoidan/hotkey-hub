/* eslint-disable no-console */
import {
  ConsoleLogger,
  Injectable,
} from '@nestjs/common';
import clc from 'cli-color';
import {AsyncLocalStorage} from 'async_hooks';
import {SemaphorService} from '@/semaphor/semaphor-service';


@Injectable()
class CustomLogger extends ConsoleLogger {
  constructor(private readonly asyncStorage: AsyncLocalStorage<Map<string, any>>) {
    super();
  }
  private logFormat(
    level: string,
    message: string,
    levelColor: (text: string) => string,
    messageStyle?: (text: string) => string
  ): string {
    const timestamp = clc.xterm(100)(`[${this.getCurrentTime()}]`);

    const store = this.asyncStorage.getStore();
    const id =  store ?  levelColor(store.get(SemaphorService.COMB_KEY) as string):  levelColor(level);
    return `${timestamp} ${id}: ${messageStyle ? messageStyle(message) : message}`;
  }

  private getCurrentTime(): string {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const millis = now.getMilliseconds().toString().padStart(3, '0');
    return `${hours}:${minutes}:${seconds}.${millis}`;
  }

  log(message: string): void {
    // Make message more prominent with bright text and underline
    console.info(this.logFormat('INFO', message, clc.bold.blue, clc.cyan));
  }

  error(message: string|Error, trace?: string): void {
    console.error(this.logFormat('ERROR', (message as Error)?.message ?? message, clc.bold.redBright, clc.red));
    if (trace ?? (message as Error)?.stack) {
      console.error(clc.red(trace ?? (message as Error)?.stack));
    }
  }

  warn(message: string): void {
    console.warn(this.logFormat('WARN', message, clc.bold.yellow, clc.yellow));
  }

  debug(message: string): void {
    console.debug(this.logFormat('DEBUG', message, clc.xterm(2), clc.xterm(7)));
  }

  verbose(message: string): void {
    console.log(this.logFormat('VERBOSE', message, clc.bold.magenta, clc.xterm(7)));
  }
}

export {CustomLogger};
