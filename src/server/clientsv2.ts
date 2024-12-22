import { Key } from '@nut-tree-fork/nut-js';


export interface Api {
  ping(): Promise<void>;

  sendKey(key: string): Promise<void>;

  sendCustomKey(id: string, run: string): Promise<void>;
}

export class ApiV2 implements Api {

  constructor(private url: string, private name: string) {
  }

  async ping(): Promise<void> {
    const res = await fetch(`http://${this.url}/ping`);
    const text = await res.text();
    if (text !== 'pong') {
      throw new Error(`Invalid response: ${text}`);
    }
  }

  async sendKey(key: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async sendCustomKey(id: string, run: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

}
