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

  async keyPress(client: string, request: KeyPressRequestDto): Promise<void> {
    return this.client.post(client, '/keyboard/key-press', request);
  }

  async typeText(client: string, request: TypeTextRequestDto): Promise<void> {
    return this.client.post(client, '/keyboard/type-text', request);
  }

  async setLayout(client: string, request: SetKeyboardLayoutRequestDto): Promise<void> {
    return this.client.post(client, '/keyboard/set-layout', request);
  }
}
