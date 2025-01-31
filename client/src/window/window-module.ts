import {
  Logger,
  Module,
  NotImplementedException,
} from '@nestjs/common';
import {ExecuteController} from '@/execute/execute-controller';
import os from 'os';
import {
  IWindowService,
  WindowService,
} from '@/window/window-model';
import {WindowsWin32Service} from '@/window/os/win32/windows-win32-service';

@Module({
  controllers: [ExecuteController],
  providers: [
    Logger,
    {
      provide: WindowService,
      inject: [Logger],
      useFactory: (logger: Logger): IWindowService => {
        const platform = os.platform();
        if (platform === 'win32') {
          return new WindowsWin32Service(logger);
        } else if (platform === 'linux') {
          throw new NotImplementedException(`Unsupported platform: ${platform}`);
        } else if (platform === 'darwin') {
          throw new NotImplementedException(`Unsupported platform: ${platform}`);
        }
        throw new NotImplementedException(`Unsupported platform: ${platform}`);
      },
    },
  ],
})
export class WindowModule {
}
