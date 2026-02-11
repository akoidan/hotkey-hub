
import {Injectable} from '@nestjs/common';
import {FetchClient} from '@/client/http-client';
import {MousePositionRRDto, Function, MouseClickRequestDto} from '@/client/dtos';

@Injectable()
export class MouseService {
  constructor(private readonly client: FetchClient) {}

  async position(client: string): Promise<void> {
    return this.client.get(client, '/mouse/position');
  }

  async moveLeftClick(client: string, request: MousePositionRRDto): Promise<void> {
    return this.client.post(client, '/mouse/move-left-click', request);
  }

  async move(client: string, request: MousePositionRRDto): Promise<void> {
    return this.client.post(client, '/mouse/move', request);
  }

  async moveHuman(client: string, request: Function): Promise<void> {
    return this.client.post(client, '/mouse/move-human', request);
  }

  async click(client: string, request: MouseClickRequestDto): Promise<void> {
    return this.client.post(client, '/mouse/click', request);
  }
}
