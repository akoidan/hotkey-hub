import { Injectable } from '@nestjs/common';
import { FetchClient } from '@/client/http-client';
import { SendKeyRequest, TypeTextRequest } from '@/client/dtos';

@Injectable()
export class KeyboardService {
  constructor(private readonly client: FetchClient) {}

  async keyPress(client: string, request: SendKeyRequest): Promise<void> {
    return this.client.post(client, '/keyboard/key-press', request);
  }

  async typeText(client: string, request: TypeTextRequest): Promise<void> {
    return this.client.post(client, '/keyboard/type-text', request, 9000);
  }
}
