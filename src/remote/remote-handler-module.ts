import {Logger, Module} from '@nestjs/common';
import {ClientModule} from '@/client/client-module';
import {KeyPressRemoteHandler} from '@/remote/implementation/key-press-remote-handler';
import {MouseMoveLeftClickRemoteHandler} from '@/remote/implementation/mouse-move-left-click-remote-handler';
import {ExecuteRemoteHandler} from '@/remote/implementation/execute-remote-handler.service';
import {TypeTextRemoteHandler} from '@/remote/implementation/type-text-remote-handler';
import {KillNameRemoteHandler} from '@/remote/implementation/kill-name-remote-handler';
import {KillPidRemoteHandler} from '@/remote/implementation/kill-pid-remote-handler';
import {ConfigModule} from '@/config/config-module';
import {LeftMouseClickRemoteHandler} from '@/remote/implementation/left-mouse-click-remote-handler';
import {Provider} from '@nestjs/common/interfaces/modules/provider.interface';
import {SemaphorModule} from '@/semaphor/semaphor.module';
import {RandomModule} from '@/random/random.module';
import {FocusWindowRemoteHandler} from '@/remote/implementation/focus-window-remote-handler';
import {CommandRemoteHandler} from '@/remote/command-remote-handler';
import {SetWindowBoundsRemoteHandler} from '@/remote/implementation/set-window-bounds-remote-handler.service';
import {MouseMoveRemoteHandler} from '@/remote/implementation/mouse-move-remote-handler';


const handlers =[
  KeyPressRemoteHandler,
  MouseMoveLeftClickRemoteHandler,
  MouseMoveRemoteHandler,
  ExecuteRemoteHandler,
  TypeTextRemoteHandler,
  KillNameRemoteHandler,
  KillPidRemoteHandler,
  LeftMouseClickRemoteHandler,
  FocusWindowRemoteHandler,
  SetWindowBoundsRemoteHandler,
];

const remoteHandlerProviders: Provider[] = [
  Logger,
  ...handlers,
  {
    provide: CommandRemoteHandler,
    inject: handlers,
    useFactory: (...lhandl: CommandRemoteHandler[]): CommandRemoteHandler => {
      for (let i = 0; i < lhandl.length - 1; i++) {
        lhandl[i].setNext(lhandl[i + 1]);
      }
      return lhandl[0];
    },
  },
];

@Module({
  imports: [ClientModule, ConfigModule, SemaphorModule, RandomModule],
  providers: remoteHandlerProviders,
  exports: [CommandRemoteHandler],
})
class RemoteHandlerModule {

}

export {
  remoteHandlerProviders,
  RemoteHandlerModule,
};
