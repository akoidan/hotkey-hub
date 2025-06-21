import {FetchClient} from '@/client/http-client';
import {
  FindPidsByNameRequest, FindPidsByNameResponse, FindProcessWindowsResponse,
  FocusExeRequest, FocusWindowRequest,
  KillExeByNameRequest,
  KillExeByPidRequest,
  LaunchExeRequest,
  LaunchPidResponse,
  MouseClickRequest,
  SendKeyRequest,
  TypeTextRequest,
} from '@/client/dtos';
import {Injectable} from '@nestjs/common';


@Injectable()
export class ClientService {
  constructor(
    private readonly client: FetchClient,
  ) {
  }

  async ping(client: string): Promise<void> {
    return this.client.get(client, '/ping');
  }

  async keyPress(client: string, request: SendKeyRequest): Promise<void> {
    return this.client.post(client, '/key-press', request);
  }

  async focusExe(client: string, request: FocusExeRequest): Promise<void> {
    return this.client.post(client, '/focus-exe', request);
  }

  async mouseMoveClick(client: string, request: MouseClickRequest): Promise<void> {
    return this.client.post(client, '/mouse-move-click', request);
  }

  async leftMouseClick(client: string): Promise<void> {
    return this.client.post(client, '/left-mouse-click', {});
  }

  async launchExe(client: string, request: LaunchExeRequest): Promise<LaunchPidResponse> {
    return this.client.post(client, '/launch-exe', request, 3000, true);
  }

  async killExeByName(client: string, request: KillExeByNameRequest): Promise<void> {
    return this.client.post(client, '/kill-exe-by-name', request);
  }

  async findPidsByName(client: string, request: FindPidsByNameRequest): Promise<FindPidsByNameResponse> {
    return this.client.post(client, '/find-pids-by-name', request, 6000, true);
  }

  async getProcessWindows(client: string, pid: number): Promise<FindProcessWindowsResponse> {
    return this.client.get(client, `/get-process-windows/${pid}`, 6000, true);
  }

  async focusWindow(client: string, request: FocusWindowRequest): Promise<void> {
    return this.client.post(client, '/focus-window', request);
  }

  async killExeById(client: string, request: KillExeByPidRequest): Promise<void> {
    return this.client.post(client, '/kill-exe-by-pid', request);
  }

  async typeText(client: string, request: TypeTextRequest): Promise<void> {
    return this.client.post(client, '/type-text', request, 9000);
  }
}
