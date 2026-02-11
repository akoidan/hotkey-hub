/** 
 * This code was generated via yarn openapi-client
 * Do not edit it manually
 */
import {Injectable} from '@nestjs/common';
import {FetchClient} from '@/client/http-client';
import {ProcessResponseDto, LaunchExeRequestDto} from '@/client/dtos';

@Injectable()
export class ProcessService {
  constructor(private readonly client: FetchClient) {}

  async getProcessInfo(client: string, pid: number): Promise<ProcessResponseDto> {
    return this.client.get(client, `/process/${pid}`);
  }

  async killExeByPid(client: string, pid: number): Promise<void> {
    return this.client.delete(client, `/process/${pid}`);
  }

  async findPidByName(client: string, name: string): Promise<number[]> {
    return this.client.get(client, '/process', { query: { name } });
  }

  async createProcess(client: string, payload: LaunchExeRequestDto): Promise<ProcessResponseDto> {
    return this.client.post(client, '/process', { payload });
  }

  async killExeByName(client: string, name: string): Promise<void> {
    return this.client.delete(client, '/process', { query: { name } });
  }
}
