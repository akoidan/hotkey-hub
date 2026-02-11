
import {Injectable} from '@nestjs/common';
import {FetchClient} from '@/client/http-client';

@Injectable()
export class AppService {
  constructor(private readonly client: FetchClient) {}

  async ping(client: string): Promise<void> {
    return this.client.get(client, '/app/ping');
  }
}
