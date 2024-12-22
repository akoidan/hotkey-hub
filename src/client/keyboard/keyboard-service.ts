import { Injectable } from '@nestjs/common';


import {
  Key,
  keyboard
} from "@nut-tree-fork/nut-js";
import { invertedMap } from '@/client/keyboard/keyboard-nut-types';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

@Injectable()
export class KeyboardService {

  constructor(
    @InjectPinoLogger(KeyboardService.name)
    private readonly logger: PinoLogger
  ) {
  }

  async sendKey(key: string): Promise<void> {
    const keymap: Key = invertedMap.get(key);
    this.logger.info('foo');
    await keyboard.type(keymap);
  }
}
