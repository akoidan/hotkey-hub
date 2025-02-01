import {
  Logger,
  Module,
  NotImplementedException,
} from '@nestjs/common';
import {KeyboardController} from '@/keyboard/keyboard-controller';
import os from 'os';
import {KeyboardWin32Service} from '@/keyboard/os/keyboard-win32-service';
import {KeyboardLinuxService} from '@/keyboard/os/keyboard-linux-service';
import {
  IKeyboardService,
  KeyboardService,
} from '@/keyboard/keyboard-model';
import {KeyboardDarwinService} from '@/keyboard/os/keyboard-darwin-service';


@Module({
  controllers: [KeyboardController],
  providers: [
    Logger,
    {
      provide: KeyboardService,
      inject: [Logger],
      useFactory: (logger: Logger): IKeyboardService => {
        const platform = os.platform();
        if (platform === 'win32') {
          return new KeyboardWin32Service(logger);
        } else if (platform === 'linux') {
          return new KeyboardLinuxService(logger);
        } else if (platform === 'darwin') {
          return new KeyboardDarwinService(logger);
        }
        throw new NotImplementedException(`Unsupported platform: ${platform}`);
      },
    },
  ],
})

export class KeyboardModule {
}
