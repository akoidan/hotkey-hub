import {Inject, Logger, Module, OnModuleInit} from '@nestjs/common';
import {INativeModule, Native} from '@/native/native-model';
import bindings from 'bindings';
import clc from 'cli-color';

@Module({
  providers: [
    Logger,
    {
      provide: Native,
      useFactory: (): INativeModule => {
        // eslint-disable-next-line
        return bindings('server');
      },
    },
  ],
  exports: [Native],
})
export class NativeModule implements OnModuleInit{
  constructor(
    private readonly logger: Logger,
    @Inject(Native)
    private readonly native: INativeModule
  ) {
  }

  onModuleInit(): any {
    this.logger.log(`Loaded native library from ${clc.bold.green(this.native.path)}`);
  }
}
