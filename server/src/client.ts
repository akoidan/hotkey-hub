import { FetchClient } from '@/http-client';


export class ApiV2 {
  private client: FetchClient;

  constructor(private url: string, private name: string) {
    this.client = new FetchClient(`http://${url}:5000`);
  }

  async ping(): Promise<void> {
    return this.client.get('ping');
  }

  async sendKey(request: { key: string }): Promise<void> {
    console.log(`${this.name} -> ${request.key}`);
    return this.client.post('send-event', { payload: request });
  }

  async sendCustomKey(id: string, run: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

}
