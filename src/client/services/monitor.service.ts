import { Injectable } from '@nestjs/common';
import { FetchClient } from '@/client/http-client';
import { MonitorIdResponseDto, MonitorInfo, MonitorScaleFactorResponseDto } from '@/client/dtos';

@Injectable()
export class MonitorService {
  constructor(private readonly client: FetchClient) {}

  async getMonitors(client: string): Promise<number[]> {
    return this.client.get(client, '/monitor');
  }

  async monitorInfo(client: string, id: number): Promise<MonitorInfo> {
    return this.client.get(client, `/monitor/${id}/info`);
  }

  async getMonitorScaleFactor(client: string, mid: number): Promise<MonitorScaleFactorResponseDto> {
    return this.client.get(client, `/monitor/${mid}/scale`);
  }

  async getMonitorFromWindow(client: string, wid: number): Promise<MonitorIdResponseDto> {
    return this.client.get(client, `/monitor/from-window/${wid}`);
  }
}
