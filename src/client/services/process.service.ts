import {Injectable} from '@nestjs/common';
import {FetchClient} from '@/client/http-client';
import {
  FindPidsByNameRequest,
  KillExeByNameRequest,
  KillExeByPidRequest,
  LaunchExeRequest,
  LaunchPidResponse,
  WindowHandleResponseDto,
} from '@/client/dtos';

@Injectable()
export class ProcessService {
  constructor(private readonly client: FetchClient) {}

  async launchExe(client: string, request: LaunchExeRequest): Promise<LaunchPidResponse> {
    return this.client.post(client, '/process/launch-exe', request, 3000, true);
  }

  async killExeByName(client: string, request: KillExeByNameRequest): Promise<void> {
    return this.client.post(client, '/process/kill-exe-by-name', request);
  }

  async findPidsByName(client: string, request: FindPidsByNameRequest): Promise<number[]> {
    return this.client.post(client, '/process/find-pids-by-name', request, 6000, true);
  }

  async killExeById(client: string, request: KillExeByPidRequest): Promise<void> {
    return this.client.post(client, '/process/kill-exe-by-pid', request);
  }

  async getProcessMainWindow(client: string, pid: number): Promise<WindowHandleResponseDto> {
    return this.client.get(client, `/process/${pid}/main-window`);
  }
}
