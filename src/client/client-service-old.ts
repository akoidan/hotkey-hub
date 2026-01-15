import {FetchClient} from '@/client/http-client';
import {
  FindPidsByNameRequest, FindPidsByNameResponse, FindProcessWindowsResponse,
  FocusExeRequest, FocusWindowRequest,
  KillExeByNameRequest,
  KillExeByPidRequest,
  LaunchExeRequest,
  LaunchPidResponse,
  MouseClickRequest, MouseMoveHumanRequest,
  SendKeyRequest, SetWindowBoundsRequest,
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
    return this.client.get(client, '/app/ping');
  }

  async keyPress(client: string, request: SendKeyRequest): Promise<void> {
    return this.client.post(client, '/keyboard/key-press', request);
  }

  async focusExe(client: string, request: FocusExeRequest): Promise<void> {
    return this.client.post(client, '/window/focus-exe', request);
  }

  async mouseMove(client: string, request: MouseClickRequest): Promise<void> {
    return this.client.post(client, '/mouse/mouse-move', request);
  }

  async mouseMoveHuman(client: string, request: MouseMoveHumanRequest): Promise<void> {
    return this.client.post(client, '/mouse/mouse-move-human', request);
  }

  async leftMouseClick(client: string): Promise<void> {
    return this.client.post(client, '/mouse/left-mouse-click', {});
  }

  async launchExe(client: string, request: LaunchExeRequest): Promise<LaunchPidResponse> {
    return this.client.post(client, '/process/launch-exe', request, 3000, true);
  }

  async setWindowBounds(client: string, request: SetWindowBoundsRequest): Promise<LaunchPidResponse> {
    return this.client.post(client, '/window/bounds', request, 5000);
  }

  async killExeByName(client: string, request: KillExeByNameRequest): Promise<void> {
    return this.client.post(client, '/process/kill-exe-by-name', request);
  }

  async findPidsByName(client: string, request: FindPidsByNameRequest): Promise<FindPidsByNameResponse> {
    return this.client.post(client, '/process/find-pids-by-name', request, 6000, true);
  }

  async getProcessWindows(client: string, pid: number): Promise<FindProcessWindowsResponse> {
    return this.client.get(client, `/window/get-process-windows/${pid}`, 6000, true);
  }

  async focusWindow(client: string, request: FocusWindowRequest): Promise<void> {
    return this.client.post(client, '/window/focus-window', request);
  }

  async killExeById(client: string, request: KillExeByPidRequest): Promise<void> {
    return this.client.post(client, '/process/kill-exe-by-pid', request);
  }

  async typeText(client: string, request: TypeTextRequest): Promise<void> {
    return this.client.post(client, '/keyboard/type-text', request, 9000);
  }
}