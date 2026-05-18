import {Inject, Logger, LogLevel, Module, OnModuleDestroy, OnModuleInit} from '@nestjs/common';
import {INativeModule, Native} from '@/native/native-model';
import clc from 'cli-color';
import {getAsset, isSea} from 'node:sea';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

import {createRequire} from 'node:module';
import {mkdtemp, writeFile} from 'node:fs/promises';
import {LOG_LEVEL} from '@/app/app-model';

// avoid rewriting native module on reload, reuse same instance
// otherwise ddl cache can trigger different issues on hotkey key load
let cache: INativeModule|null = null;

@Module({
  providers: [
    Logger,
    {
      provide: Native,
      useFactory: async(): Promise<INativeModule> => {
        if (cache) {
          return cache;
        }
        if (isSea()) {
          const tmp = await mkdtemp(join(tmpdir(), 'sea-'));
          const pathOnDisk = join(tmp, 'native.node');
          await writeFile(pathOnDisk, Buffer.from(getAsset('native')));
          const requireFromHere = createRequire(__filename);
          // eslint-disable-next-line
          cache = requireFromHere(pathOnDisk) as INativeModule;
        } else {
          // eslint-disable-next-line
          const bindings = require('bindings') as any;
          // eslint-disable-next-line
          cache= bindings('native') as INativeModule;
        }
        return cache;
      },
    },
  ],
  exports: [Native],
})
export class NativeModule implements OnModuleInit, OnModuleDestroy {
  constructor(
    private readonly logger: Logger,
    @Inject(Native)
    private readonly native: INativeModule,
    @Inject(LOG_LEVEL)
    private readonly logLevel: LogLevel
  ) {
  }

  onModuleDestroy(): void {
    this.native.cleanupHotkeys();
  }

  onModuleInit(): any {
    this.native.setLoggerLevel(['debug' , 'verbose'].includes(this.logLevel));
    this.logger.log(`Loaded native library from ${clc.bold.green(this.native.path)}`);
  }
}
