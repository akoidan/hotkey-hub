/** 
 * This code was generated via yarn openapi-client
 * Do not edit it manually
 */
import {Injectable} from '@nestjs/common';
import {FetchClient} from '@/client/http-client';
import {ApiOptions} from '@/client/client-model';
import {PingResponseDto} from '@/client/dtos';

@Injectable()
export class AppService {
  constructor(private readonly client: FetchClient) {}

  async ping(client: string, options: ApiOptions = {}): Promise<PingResponseDto> {
    return this.client.get(client, '/app/ping', {...options});
  }
}
