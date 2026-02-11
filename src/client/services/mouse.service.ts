/** 
 * This code was generated via yarn openapi-client
 * Do not edit it manually
 */
import {Injectable} from '@nestjs/common';
import {FetchClient} from '@/client/http-client';
import {MousePositionRRDto, MouseMoveHumanRequestDto, MouseClickRequestDto} from '@/client/dtos';

@Injectable()
export class MouseService {
  constructor(private readonly client: FetchClient) {}

  async getPosition(client: string): Promise<MousePositionRRDto> {
    return this.client.get(client, '/mouse/position');
  }

  async moveLeftClick(client: string, request: MousePositionRRDto): Promise<void> {
    return this.client.post(client, '/mouse/move-left-click', request);
  }

  async setMousePosition(client: string, request: MousePositionRRDto): Promise<void> {
    return this.client.post(client, '/mouse/move', request);
  }

  async mouseMoveHuman(client: string, request: MouseMoveHumanRequestDto): Promise<void> {
    return this.client.post(client, '/mouse/move-human', request);
  }

  async click(client: string, request: MouseClickRequestDto): Promise<void> {
    return this.client.post(client, '/mouse/click', request);
  }
}
