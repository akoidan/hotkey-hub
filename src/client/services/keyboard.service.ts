/** 
 * This code was generated via yarn openapi-client
 * Do not edit it manually
 */
import {Injectable} from '@nestjs/common';
import {FetchClient} from '@/client/http-client';
import {ApiOptions} from '@/client/client-model';
import {KeyPressRequestDto, TypeTextRequestDto, SetKeyboardLayoutRequestDto} from '@/client/dtos';

@Injectable()
export class KeyboardService {
  constructor(private readonly client: FetchClient) {}

  async keyPress(client: string, payload: KeyPressRequestDto, options: ApiOptions = {}): Promise<void> {
    return this.client.post(client, '/keyboard/key-press', {...options, payload});
  }

  async typeText(client: string, payload: TypeTextRequestDto, options: ApiOptions = {}): Promise<void> {
    return this.client.post(client, '/keyboard/type-text', {...options, payload});
  }

  async setLayout(client: string, payload: SetKeyboardLayoutRequestDto, options: ApiOptions = {}): Promise<void> {
    return this.client.post(client, '/keyboard/set-layout', {...options, payload});
  }
}
