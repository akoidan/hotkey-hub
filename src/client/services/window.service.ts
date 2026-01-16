import {Injectable} from '@nestjs/common';
import {FetchClient} from '@/client/http-client';
import {
  ActiveWindowIdResponseDto,
  FocusExeRequest,
  FocusWindowRequest,
  GetActiveWindowInfoResponse,
  IsWindowResponseDto,
  IsWindowVisibleResponseDto,
  SetWindowBoundsRequest,
  WindowBounds,
  WindowOpacityResponseDto,
  WindowOwnerResponseDto,
  WindowTitleResponseDto,
} from '@/client/dtos';

@Injectable()
export class WindowService {
  constructor(private readonly client: FetchClient) {}

  async focusExe(client: string, request: FocusExeRequest): Promise<void> {
    return this.client.post(client, '/window/focus-by-pid', request);
  }

  async setWindowBounds(client: string, request: SetWindowBoundsRequest): Promise<void> {
    return this.client.post(client, '/window/bounds', request, 5000);
  }

  async getProcessWindows(client: string, pid: number): Promise<number[]> {
    return this.client.get(client, `/window/by-process/${pid}`, 6000, true);
  }

  async focusWindow(client: string, request: FocusWindowRequest): Promise<void> {
    return this.client.post(client, '/window/focus', request);
  }

  async getActiveWindowId(client: string): Promise<ActiveWindowIdResponseDto> {
    return this.client.get(client, '/window/active-id');
  }

  async getActiveWindowInfo(client: string): Promise<GetActiveWindowInfoResponse>  {
    return this.client.get(client, '/window/active-info');
  }

  async getWindowBounds(client: string, wid: number): Promise<WindowBounds> {
    return this.client.get(client, `/window/${wid}/bounds`);
  }

  async getWindowTitle(client: string, wid: number): Promise<WindowTitleResponseDto> {
    return this.client.get(client, `/window/${wid}/title`);
  }

  async getWindowOpacity(client: string, wid: number): Promise<WindowOpacityResponseDto> {
    return this.client.get(client, `/window/${wid}/opacity`);
  }

  async getWindowOwner(client: string, wid: number): Promise<WindowOwnerResponseDto> {
    return this.client.get(client, `/window/${wid}/owner`);
  }

  async isWindow(client: string, wid: number): Promise<IsWindowResponseDto> {
    return this.client.get(client, `/window/${wid}/is-valid`);
  }

  async isWindowVisible(client: string, wid: number): Promise<IsWindowVisibleResponseDto> {
    return this.client.get(client, `/window/${wid}/is-visible`);
  }
}
