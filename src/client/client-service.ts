import {FetchClient} from '@/client/http-client';
import {
  FindPidsByNameRequest,
  FocusExeRequest,
  FocusWindowRequest,
  GetActiveWindowInfoResponse,
  KillExeByNameRequest,
  KillExeByPidRequest,
  LaunchExeRequest,
  LaunchPidResponse,
  MonitorInfo,
  MouseClickRequest,
  MouseMoveHumanRequest,
  SendKeyRequest,
  SetWindowBoundsRequest,
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
    return this.client.post(client, '/mouse/move', request);
  }

  async mouseMoveHuman(client: string, request: MouseMoveHumanRequest): Promise<void> {
    return this.client.post(client, '/mouse/move-human', request);
  }

  async leftMouseClick(client: string): Promise<void> {
    return this.client.post(client, '/mouse/left-click', {});
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

  async findPidsByName(client: string, request: FindPidsByNameRequest): Promise<number[]> {
    return this.client.post(client, '/process/find-pids-by-name', request, 6000, true);
  }

  async getProcessWindows(client: string, pid: number): Promise<[]> {
    return this.client.get(client, `/window/by-process/${pid}`, 6000, true);
  }

  async focusWindow(client: string, request: FocusWindowRequest): Promise<void> {
    return this.client.post(client, '/window/focus', request);
  }

  async monitorInfo(client: string, id: number): Promise<MonitorInfo> {
    return this.client.get(client, `/monitor/${id}/info`);
  }

  async killExeById(client: string, request: KillExeByPidRequest): Promise<void> {
    return this.client.post(client, '/process/kill-exe-by-pid', request);
  }

  async typeText(client: string, request: TypeTextRequest): Promise<void> {
    return this.client.post(client, '/keyboard/type-text', request, 9000);
  }

  async getActiveWindowId(client: string): Promise<number> {
    return this.client.get(client, '/window/active-id');
  }

  async getActiveWindowInfo(client: string): Promise<GetActiveWindowInfoResponse>  {
    return this.client.get(client, '/window/active-info');
  }

  async getWindowBounds(client: string, wid: number): Promise<any> {
    return this.client.get(client, `/window/${wid}/bounds`);
  }

  async getWindowTitle(client: string, wid: number): Promise<string> {
    return this.client.get(client, `/window/${wid}/title`);
  }

  async getWindowOpacity(client: string, wid: number): Promise<number> {
    return this.client.get(client, `/window/${wid}/opacity`);
  }

  async getWindowOwner(client: string, wid: number): Promise<any> {
    return this.client.get(client, `/window/${wid}/owner`);
  }

  async isWindow(client: string, wid: number): Promise<boolean> {
    return this.client.get(client, `/window/${wid}/is-valid`);
  }

  async isWindowVisible(client: string, wid: number): Promise<boolean> {
    return this.client.get(client, `/window/${wid}/is-visible`);
  }

  async getMonitors(client: string): Promise<any[]> {
    return this.client.get(client, '/monitor');
  }

  async getMonitorScaleFactor(client: string, mid: number): Promise<number> {
    return this.client.get(client, `/monitor/${mid}/scale`);
  }

  async getMonitorFromWindow(client: string, wid: number): Promise<number> {
    return this.client.get(client, `/monitor/from-window/${wid}`);
  }

  async getProcessMainWindow(client: string, pid: number): Promise<number> {
    return this.client.get(client, `/process/${pid}/main-window`);
  }
}
