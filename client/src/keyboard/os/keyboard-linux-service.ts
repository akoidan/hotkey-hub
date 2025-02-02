/*
 eslint-disable no-await-in-loop
 */
import {
  Injectable,
  Logger,
} from '@nestjs/common';
import {IKeyboardService} from '@/keyboard/keyboard-model';
import {NativeModule} from "@/native/native-interface";

@Injectable()
export class KeyboardLinuxService implements IKeyboardService {
  constructor(
    private readonly logger: Logger,
    private readonly addon: NativeModule
  ) {
  }

  private readonly specialCharacters = '$';

  public async type(text: string): Promise<void> {
    if (text.includes(this.specialCharacters)) {
      await this.typeWithSpecialCharacters(text);
    } else {
      this.logger.log(`Type: \u001b[35m${text}`);
      await this.addon.typeString(text);
    }
  }

  public async sendKey(keys: string[], holdKeys: string[]): Promise<void> {
    for (const key of holdKeys) {
      this.logger.log(`HoldKey: \u001b[35m${key}`);
      this.addon.keyToggle(key, [], true);
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
      this.addon.keyToggle(key, [], false);
    }
    await new Promise((resolve) => {setTimeout(resolve, 10);});
  }

  private async typeWithSpecialCharacters(text: string): Promise<void> {
    const parts = text.split('$');
    for (let i = 0; i < parts.length; i++) {
      this.logger.log(`Type: \u001b[35m${parts[i]}`);
      await this.addon.typeString(parts[i]);
      // eslint-disable-next-line @typescript-eslint/no-loop-func
      await new Promise((resolve) => {setTimeout(resolve, 10);});
      if (i < parts.length - 1) {
        await this.sendKey(['4'], ['shift']);
      }
    }
  }
}
