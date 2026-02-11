/** 
 * This code was generated via yarn openapi-client
 * Do not edit it manually
 */
import {Injectable} from '@nestjs/common';
import {FetchClient} from '@/client/http-client';
import {GetWindowResponseDto, SetWindowPropertiesRequestDto} from '@/client/dtos';

@Injectable()
export class WindowService {
  constructor(private readonly client: FetchClient) {}

  async getWindowInfo(client: string, wid: number): Promise<GetWindowResponseDto> {
    return this.client.get(client, `/window/by-wid/${wid}`);
  }

  async setWindowProperties(client: string, wid: number, request: SetWindowPropertiesRequestDto): Promise<void> {
    return this.client.patch(client, `/window/by-wid/${wid}`, request);
  }

  async getActiveWindowInfo(client: string): Promise<GetWindowResponseDto> {
    return this.client.get(client, '/window/active');
  }

  async setWindowActive(client: string, wid: number): Promise<void> {
    return this.client.post(client, `/window/by-wid/${wid}/focus`);
  }
}
