/** 
 * This code was generated via yarn openapi-client
 * Do not edit it manually
 */
import {Injectable} from '@nestjs/common';
import {FetchClient} from '@/client/http-client';
import {KeyPressRequestDto, TypeTextRequestDto, SetKeyboardLayoutRequestDto} from '@/client/dtos';

@Injectable()
export class KeyboardService {
  constructor(private readonly client: FetchClient) {}

  async keyPress(client: string, payload: KeyPressRequestDto): Promise<void> {
    return this.client.post(client, '/keyboard/key-press', {payload});
  }

  async typeText(client: string, payload: TypeTextRequestDto): Promise<void> {
    return this.client.post(client, '/keyboard/type-text', {payload});
  }

  async setLayout(client: string, payload: SetKeyboardLayoutRequestDto): Promise<void> {
    return this.client.post(client, '/keyboard/set-layout', {payload});
  }
}
