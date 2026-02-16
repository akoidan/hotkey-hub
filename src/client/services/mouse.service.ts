/** 
 * This code was generated via yarn openapi-client
 * Do not edit it manually
 */
import {Injectable} from '@nestjs/common';
import {FetchClient} from '@/client/http-client';
import {ApiOptions} from '@/client/client-model';
import {MousePositionRRDto, MouseMoveHumanRequestDto, MouseClickRequestDto} from '@/client/dtos';

@Injectable()
export class MouseService {
  constructor(private readonly client: FetchClient) {}

  async getPosition(client: string, options: ApiOptions = {}): Promise<MousePositionRRDto> {
    return this.client.get(client, '/mouse/position', {...options});
  }

  async moveLeftClick(client: string, payload: MousePositionRRDto, options: ApiOptions = {}): Promise<void> {
    return this.client.post(client, '/mouse/move-left-click', {...options, payload});
  }

  async setMousePosition(client: string, payload: MousePositionRRDto, options: ApiOptions = {}): Promise<void> {
    return this.client.post(client, '/mouse/move', {...options, payload});
  }

  async mouseMoveHuman(client: string, payload: MouseMoveHumanRequestDto, options: ApiOptions = {}): Promise<void> {
    return this.client.post(client, '/mouse/move-human', {...options, payload});
  }

  async click(client: string, payload: MouseClickRequestDto, options: ApiOptions = {}): Promise<void> {
    return this.client.post(client, '/mouse/click', {...options, payload});
  }
}
