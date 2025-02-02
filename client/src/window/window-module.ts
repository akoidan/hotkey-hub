import {
  Logger,
  Module,
  NotImplementedException,
} from '@nestjs/common';
import os from 'os';
import {
  IWindowService,
  WindowService,
} from '@/window/window-model';
import {WindowWin32Service} from '@/window/os/window-win32-service';
import {WindowDarwinService} from '@/window/os/window-darwin.service';
import {WindowLinuxService} from '@/window/os/window-linux-service';
import {WindowController} from '@/window/window-controller';
import type {NativeModule} from '@/native/native-interface';

@Module({
  controllers: [WindowController],
  providers: [
    Logger,
    {
      provide: WindowService,
      inject: [Logger],
      useFactory: (logger: Logger): IWindowService => {
        const platform = os.platform();
        if (platform === 'win32') {
          // eslint-disable-next-line
          const addon: NativeModule =  process.env.DEBUG_NATIVE ? require('../../build/Debug/native.node') : require('../native/win32/native-win32.node');
          return new WindowWin32Service(logger, addon);
        } else if (platform === 'linux') {
          // eslint-disable-next-line
          const addon: NativeModule =  process.env.DEBUG_NATIVE ? require('../../build/Debug/native.node') : require('../native/linux/native-linux.node');
          return new WindowLinuxService(logger, addon);
        } else if (platform === 'darwin') {
          return new WindowDarwinService(logger);
        }
        throw new NotImplementedException(`Unsupported platform: ${platform}`);
      },
    },
  ],
})
export class WindowModule {
}
