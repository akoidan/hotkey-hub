/** 
 * This code was generated via yarn openapi-client
 * Do not edit it manually
 */
import {Injectable} from '@nestjs/common';
import {FetchClient} from '@/client/http-client';
import {ApiOptions} from '@/client/client-model';
import {MonitorInfoResponseDto} from '@/client/dtos';

@Injectable()
export class MonitorService {
  constructor(private readonly client: FetchClient) {}

  async getMonitors(client: string, options: ApiOptions = {}): Promise<number[]> {
    return this.client.get(client, '/monitor', {...options});
  }

  async getMonitorInfo(client: string, mid: number, options: ApiOptions = {}): Promise<MonitorInfoResponseDto> {
    return this.client.get(client, `/monitor/${mid}/info`, {...options});
  }
}
