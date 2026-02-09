import {Injectable} from '@nestjs/common';
import {FetchClient} from '@/client/http-client';
import {PingResponseDto} from '@/client/dtos';

@Injectable()
export class PingService {
  constructor(private readonly client: FetchClient) {}

  async ping(client: string): Promise<PingResponseDto> {
    return this.client.get(client, '/app/ping');
  }
}
