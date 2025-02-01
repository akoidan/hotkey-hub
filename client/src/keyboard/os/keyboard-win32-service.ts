/*
 eslint-disable no-await-in-loop
 */
import {
  Injectable,
  Logger,
} from '@nestjs/common';
import {invertedMap} from '@/keyboard/keyboard-dto';
import {IKeyboardService} from '@/keyboard/keyboard-model';
import {NativeModule} from '@/native/native-interface';

@Injectable()
export class KeyboardWin32Service  implements IKeyboardService  {
  private readonly addon: NativeModule;


  constructor(
    private readonly logger: Logger
  ) {
    // eslint-disable-next-line
    this.addon = require('../../native/win32/native-win32.node');
  }


  public async type(text: string): Promise<void> {
      this.logger.log(`Type: \u001b[35m${text}`);
      await this.addon.typeString(text);
  }

  public async sendKey(keys: string[], holdKeys: string[]): Promise<void> {
    for (const key of holdKeys) {
      this.logger.log(`HoldKey: \u001b[35m${key}`);
      this.addon.keyToggle(key, 'down', []);
    }
    for (const key of keys) {
      this.logger.log(`KeyPress: \u001b[35m${key}`);
      this.addon.keyTap(key, []);
      // eslint-disable-next-line @typescript-eslint/no-loop-func
      await new Promise(resolve => {
        setTimeout(resolve, 10);
      });
    }
    for (const key of holdKeys) {
      this.logger.log(`ReleaseKey: \u001b[35m${key}`);
      this.addon.keyToggle(key, 'down', []);
    }
    await new Promise((resolve) => {setTimeout(resolve, 10);});
  }
}
