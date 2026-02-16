/** 
 * This code was generated via yarn openapi-client
 * Do not edit it manually
 */
import {Injectable} from '@nestjs/common';
import {FetchClient} from '@/client/http-client';
import {ApiOptions} from '@/client/client-model';
import {GetWindowResponseDto, SetWindowPropertiesRequestDto} from '@/client/dtos';

@Injectable()
export class WindowService {
  constructor(private readonly client: FetchClient) {}

  async getWindowInfo(client: string, wid: number, options: ApiOptions = {}): Promise<GetWindowResponseDto> {
    return this.client.get(client, `/window/by-wid/${wid}`, {...options});
  }

  async setWindowProperties(client: string, wid: number, payload: SetWindowPropertiesRequestDto, options: ApiOptions = {}): Promise<void> {
    return this.client.patch(client, `/window/by-wid/${wid}`, {...options, payload});
  }

  async getActiveWindowInfo(client: string, options: ApiOptions = {}): Promise<GetWindowResponseDto> {
    return this.client.get(client, '/window/active', {...options});
  }

  async setWindowActive(client: string, wid: number, options: ApiOptions = {}): Promise<void> {
    return this.client.post(client, `/window/by-wid/${wid}/focus`, {...options});
  }
}
