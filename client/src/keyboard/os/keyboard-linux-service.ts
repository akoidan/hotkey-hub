/*
 eslint-disable no-await-in-loop
 */
import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { IKeyboardService } from '@/keyboard/keyboard-model';
import { INativeModule } from '@/native/native-interface';

@Injectable()
export class KeyboardLinuxService implements IKeyboardService {
  constructor(
    private readonly logger: Logger,
    private readonly addon: INativeModule
  ) {
  }

  public async type(text: string): Promise<void> {
    await new Promise((resolve) => {setTimeout(resolve, 500);});
    await this.addon.typeString(text);
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
  }
}
