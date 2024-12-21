import { Injectable } from '@nestjs/common';


import { keyboard, Key } from "@nut-tree-fork/nut-js";


@Injectable()
export class AppService {
  async getHello(): Promise<string> {
    // Type a single key
    setTimeout(() =>      keyboard.type(Key.A));

    return 'Hello World!';
  }
}
