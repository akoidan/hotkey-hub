
import {Injectable} from '@nestjs/common';
import {FetchClient} from '@/client/http-client';

@Injectable()
export class MonitorService {
  constructor(private readonly client: FetchClient) {}

  async getMonitor(client: string): Promise<void> {
    return this.client.get(client, '/monitor');
  }

  async info(client: string, mid: number): Promise<void> {
    return this.client.get(client, `/monitor/${mid}/info`);
  }
}
