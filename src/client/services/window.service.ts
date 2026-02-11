
import {Injectable} from '@nestjs/common';
import {FetchClient} from '@/client/http-client';
import {SetWindowPropertiesRequestDto} from '@/client/dtos';

@Injectable()
export class WindowService {
  constructor(private readonly client: FetchClient) {}

  async getWindow(client: string, wid: number): Promise<void> {
    return this.client.get(client, `/window/${wid}`);
  }

  async setWindow(client: string, wid: number, request: SetWindowPropertiesRequestDto): Promise<void> {
    return this.client.patch(client, `/window/${wid}`, request);
  }

  async active(client: string): Promise<void> {
    return this.client.get(client, '/window/active');
  }

  async focus(client: string, wid: number): Promise<void> {
    return this.client.post(client, `/window/${wid}/focus`);
  }
}
