/** 
 * This code was generated via yarn openapi-client
 * Do not edit it manually
 */
import {Injectable} from '@nestjs/common';
import {FetchClient} from '@/client/http-client';
import {SetWindowPropertiesRequestDto} from '@/client/dtos';

@Injectable()
export class WindowService {
  constructor(private readonly client: FetchClient) {}

  async getWindowBounds(client: string, wid: number): Promise<void> {
    return this.client.get(client, `/window/by-wid/${wid}`);
  }

  async setWindowBounds(client: string, wid: number, request: SetWindowPropertiesRequestDto): Promise<void> {
    return this.client.patch(client, `/window/by-wid/${wid}`, request);
  }

  async getWindowActiveId(client: string): Promise<void> {
    return this.client.get(client, '/window/active');
  }

  async focusWindowId(client: string, wid: number): Promise<void> {
    return this.client.post(client, `/window/by-wid/${wid}/focus`);
  }
}
