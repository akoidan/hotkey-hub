import { Module } from '@nestjs/common';
import { ClientModule } from '@/client/client-module';
import { ConfigModule } from '@/config/config-module';
import { GetInfoHandler } from './get-info-handler';
import { PingHandler } from './implementation/ping-handler';
import { GetActiveWindowIdHandler } from './implementation/get-active-window-id-handler';
import { GetActiveWindowHandler } from './implementation/get-active-window-handler';
import { GetWindowBoundsHandler } from './implementation/get-window-bounds-handler';
import { GetWindowTitleHandler } from './implementation/get-window-title-handler';
import { GetWindowOpacityHandler } from './implementation/get-window-opacity-handler';
import { GetWindowOwnerHandler } from './implementation/get-window-owner-handler';
import { IsWindowHandler } from './implementation/is-window-handler';
import { IsWindowVisibleHandler } from './implementation/is-window-visible-handler';
import { GetMonitorsHandler } from './implementation/get-monitors-handler';
import { GetMonitorInfoHandler } from './implementation/get-monitor-info-handler';
import { GetMonitorFromWindowHandler } from './implementation/get-monitor-from-window-handler';
import { GetMonitorScaleFactorHandler } from './implementation/get-monitor-scale-factor-handler';
import { GetProcessMainWindowHandler } from './implementation/get-process-main-window-handler';
import { GetWindowsIdByPidHandler } from './implementation/get-windows-id-by-pid-handler';

const getInfoHandlers = [
  PingHandler,
  GetActiveWindowIdHandler,
  GetActiveWindowHandler,
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
      useFactory: (...handlers: GetInfoHandler[]) => {
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
export class GetInfoModule {}
