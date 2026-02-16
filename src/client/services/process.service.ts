/** 
 * This code was generated via yarn openapi-client
 * Do not edit it manually
 */
import {Injectable} from '@nestjs/common';
import {FetchClient} from '@/client/http-client';
import {ApiOptions} from '@/client/client-model';
import {ProcessResponseDto, LaunchExeRequestDto, CreateProcessResponseDto} from '@/client/dtos';

@Injectable()
export class ProcessService {
  constructor(private readonly client: FetchClient) {}

  async getProcessInfo(client: string, pid: number, options: ApiOptions = {}): Promise<ProcessResponseDto> {
    return this.client.get(client, `/process/${pid}`, {...options});
  }

  async killExeByPid(client: string, pid: number, options: ApiOptions = {}): Promise<void> {
    return this.client.delete(client, `/process/${pid}`, {...options});
  }

  async findPidByName(client: string, name: string, options: ApiOptions = {}): Promise<number[]> {
    return this.client.get(client, '/process', {...options, query: {name}});
  }

  async createProcess(client: string, payload: LaunchExeRequestDto, options: ApiOptions = {}): Promise<CreateProcessResponseDto> {
    return this.client.post(client, '/process', {...options, payload});
  }

  async killExeByName(client: string, name: string, options: ApiOptions = {}): Promise<void> {
    return this.client.delete(client, '/process', {...options, query: {name}});
  }
}
