/** 
 * This code was generated via yarn openapi-client
 * Do not edit it manually
 */
import {Injectable} from '@nestjs/common';
import {FetchClient} from '@/client/http-client';
import {LaunchExeRequestDto} from '@/client/dtos';

@Injectable()
export class ProcessService {
  constructor(private readonly client: FetchClient) {}

  async getProcess(client: string, pid: number): Promise<void> {
    return this.client.get(client, `/process/${pid}`);
  }

  async deleteProcess(client: string, pid: number): Promise<void> {
    return this.client.delete(client, `/process/${pid}`);
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
