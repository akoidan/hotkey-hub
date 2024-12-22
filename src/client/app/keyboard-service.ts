import { Injectable } from '@nestjs/common';


import { keyboard, Key } from "@nut-tree-fork/nut-js";


@Injectable()
export class KeyboardService {
  async sendKey(key: Key): Promise<void> {
    await keyboard.type(key);
  }
}
