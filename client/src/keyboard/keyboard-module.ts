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
import {
  INativeModule,
  Native,
} from '@/native/native-interface';
import {NativeModule} from '@/native/native-module';

@Module({
  imports: [NativeModule],
  controllers: [KeyboardController],
  providers: [
    Logger,
    {
      provide: KeyboardService,
      inject: [Logger, Native],
      useFactory: (logger: Logger, addon: INativeModule): IKeyboardService => {
        const platform = os.platform();
        if (platform === 'win32') {
          return new KeyboardWin32Service(logger, addon);
        } else if (platform === 'linux') {
          // eslint-disable-next-line
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
