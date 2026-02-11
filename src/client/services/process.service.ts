
import {Injectable} from '@nestjs/common';
import {FetchClient} from '@/client/http-client';
import {LaunchExeRequestDto} from '@/client/dtos';

@Injectable()
export class ProcessService {
  constructor(private readonly client: FetchClient) {}

  async getProcess(client: string, id: number): Promise<void> {
    return this.client.get(client, `/process/${id}`);
  }

  async deleteProcess(client: string, mid: number): Promise<void> {
    return this.client.delete(client, `/process/${mid}`);
  }

  async getProcess1(client: string): Promise<void> {
    return this.client.get(client, '/process');
  }

  async createProcess(client: string, request: LaunchExeRequestDto): Promise<void> {
    return this.client.post(client, '/process', request);
  }

  async deleteProcess1(client: string): Promise<void> {
    return this.client.delete(client, '/process');
  }
}
