import {Module} from '@nestjs/common';
import {ClientModule} from '@/client/client-module';
import {ConfigModule} from '@/config/config-module';
import {GetInfoHandler} from '@/get-info/get-info-handler';
import {PingHandler} from '@/get-info/implementation/ping-handler';
import {GetWindowBoundsHandler} from '@/get-info/implementation/get-window-bounds-handler';
import {GetWindowTitleHandler} from '@/get-info/implementation/get-window-title-handler';
import {GetWindowOpacityHandler} from '@/get-info/implementation/get-window-opacity-handler';
import {GetWindowOwnerHandler} from '@/get-info/implementation/get-window-owner-handler';
import {IsWindowHandler} from '@/get-info/implementation/is-window-handler';
import {IsWindowVisibleHandler} from '@/get-info/implementation/is-window-visible-handler';
import {GetMonitorsHandler} from '@/get-info/implementation/get-monitors-handler';
import {GetMonitorInfoHandler} from '@/get-info/implementation/get-monitor-info-handler';
import {GetMonitorFromWindowHandler} from '@/get-info/implementation/get-monitor-from-window-handler';
import {GetMonitorScaleFactorHandler} from '@/get-info/implementation/get-monitor-scale-factor-handler';
import {GetProcessMainWindowHandler} from '@/get-info/implementation/get-process-main-window-handler';
import {GetWindowsIdByPidHandler} from '@/get-info/implementation/get-windows-id-by-pid-handler';
import {GetActiveWindowInfoHandler} from '@/get-info/implementation/get-active-window-info-handler';

const getInfoHandlers = [
  PingHandler,
  GetActiveWindowInfoHandler,
  GetActiveWindowInfoHandler,
  GetWindowBoundsHandler,
  GetWindowTitleHandler,
  GetWindowOpacityHandler,
  GetWindowOwnerHandler,
  IsWindowHandler,
  IsWindowVisibleHandler,
  GetMonitorsHandler,
  GetMonitorInfoHandler,
  GetMonitorFromWindowHandler,
  GetMonitorScaleFactorHandler,
  GetProcessMainWindowHandler,
  GetWindowsIdByPidHandler,
];

@Module({
  imports: [ClientModule, ConfigModule],
  providers: [
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
  ],
  exports: [GetInfoHandler],
})
export class GetInfoModule {
}

