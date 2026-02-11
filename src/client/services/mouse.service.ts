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

  async moveLeftClick(client: string, payload: MousePositionRRDto): Promise<void> {
    return this.client.post(client, '/mouse/move-left-click', {payload});
  }

  async setMousePosition(client: string, payload: MousePositionRRDto): Promise<void> {
    return this.client.post(client, '/mouse/move', {payload});
  }

  async mouseMoveHuman(client: string, payload: MouseMoveHumanRequestDto): Promise<void> {
    return this.client.post(client, '/mouse/move-human', {payload});
  }

  async click(client: string, payload: MouseClickRequestDto): Promise<void> {
    return this.client.post(client, '/mouse/click', {payload});
  }
}
