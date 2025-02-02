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
import process from "node:process";
import {NativeModule} from "@/native/native-interface";


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
          // eslint-disable-next-line
          const addon: NativeModule = require('../native/win32/native-win32.node');
          return new KeyboardWin32Service(logger, addon);
        } else if (platform === 'linux') {
          // eslint-disable-next-line
          const addon: NativeModule = require('../native/linux/native-linux.node');
          return new KeyboardLinuxService(logger, addon);
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
