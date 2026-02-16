import {Logger, Module} from '@nestjs/common';
import {ClientModule} from '@/client/client-module';
import {ConfigModule} from '@/config/config-module';
import {GetInfoHandler} from '@/get-info/get-info-handler';
import {PingHandler} from '@/get-info/implementation/ping-handler';

import {GetMonitorsHandler} from '@/get-info/implementation/get-monitors-handler';
import {GetMonitorInfoHandler} from '@/get-info/implementation/get-monitor-info-handler';
import {GetWindowsIdByPidHandler} from '@/get-info/implementation/get-windows-id-by-pid-handler';
import {GetActiveWindowInfoHandler} from '@/get-info/implementation/get-active-window-info-handler';
import {GetWindowInfoHandler} from '@/get-info/implementation/get-window-info-handler';
import {Provider} from '@nestjs/common/interfaces/modules/provider.interface';
import {GetWindowsIdByMultiplePidsHandler} from '@/get-info/implementation/get-windows-id-by-multiple-pids-handler';
import {GetPidsByNameHandler} from '@/get-info/implementation/get-pids-by-name-handler';

const getInfoHandlers = [
  PingHandler,
  GetActiveWindowInfoHandler,
  GetWindowInfoHandler,
  GetWindowsIdByMultiplePidsHandler,
  GetPidsByNameHandler,
  GetMonitorsHandler,
  GetMonitorInfoHandler,
  GetWindowsIdByPidHandler,
];

const getInfoProviders: Provider[] = [
  ...getInfoHandlers,
  {
    provide: GetInfoHandler,
    useFactory: (...handlers: GetInfoHandler[]): GetInfoHandler => {
      for (let i = 0; i < handlers.length - 1; i++) {
        handlers[i].setNext(handlers[i + 1]);
      }
      return handlers[0];
    },
    inject: [...getInfoHandlers],
  },
];

@Module({
  imports: [ClientModule, ConfigModule],
  providers: [
    Logger,
    ...getInfoProviders,
  ],
  exports: [GetInfoHandler],
})
class GetInfoModule {
}

export {getInfoHandlers, getInfoProviders, GetInfoModule};
