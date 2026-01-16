import {Injectable} from '@nestjs/common';
import {FetchClient} from '@/client/http-client';
import {MouseClickRequest, MouseMoveHumanRequest} from '@/client/dtos';

@Injectable()
export class MouseService {
  constructor(private readonly client: FetchClient) {}

  async mouseMove(client: string, request: MouseClickRequest): Promise<void> {
    return this.client.post(client, '/mouse/move', request);
  }

  async mouseMoveHuman(client: string, request: MouseMoveHumanRequest): Promise<void> {
    return this.client.post(client, '/mouse/move-human', request);
  }

  async leftMouseClick(client: string): Promise<void> {
    return this.client.post(client, '/mouse/left-click', {});
  }

  async mouseMoveLeftClick(client: string, request: MouseClickRequest): Promise<void> {
    return this.client.post(client, '/mouse/move-left-click', request);
  }
}
