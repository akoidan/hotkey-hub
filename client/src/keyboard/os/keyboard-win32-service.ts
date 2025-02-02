/*
 eslint-disable no-await-in-loop
 */
import {Injectable, Logger} from '@nestjs/common';
import {IKeyboardService} from '@/keyboard/keyboard-model';
import {NativeModule} from '@/native/native-interface';

@Injectable()
export class KeyboardWin32Service  implements IKeyboardService  {

  constructor(
    private readonly logger: Logger,
    private readonly addon: NativeModule
  ) {
  }


  public async type(text: string): Promise<void> {
      this.logger.log(`Type: \u001b[35m${text}`);
      await this.addon.typeString(text);
  }

  public async sendKey(keys: string[], holdKeys: string[]): Promise<void> {
    // const libnut = require('@nut-tree-fork/libnut-win32/build/Release/libnut.node')
    for (const key of holdKeys) {
      this.logger.log(`HoldKey: \u001b[35m${key}`);
      // libnut.keyToggle(key, 'down', [])
      this.addon.keyToggle(key, [], true);
    }
    for (const key of keys) {
      await new Promise(resolve => {
        setTimeout(resolve, 10);
      });
      this.logger.log(`KeyPress: \u001b[35m${key}`);
      this.addon.keyTap(key, []);
      // eslint-disable-next-line @typescript-eslint/no-loop-func
      await new Promise(resolve => {
        setTimeout(resolve, 10);
      });
    }
    for (const key of holdKeys) {
      await new Promise(resolve => {
        setTimeout(resolve, 10);
      });
      this.logger.log(`ReleaseKey: \u001b[35m${key}`);
      this.addon.keyToggle(key, [], false);
    }
    await new Promise((resolve) => {setTimeout(resolve, 10);});
  }
}
