import {Logger, Module} from '@nestjs/common';
import {ClientModule} from '@/client/client-module';
import {KeyPressRemoteHandler} from '@/remote/implementation/key-press-remote-handler';
import {FocusProcessWindowRemoteHandler} from '@/remote/implementation/focus-process-window-remote-handler';
import {MouseClickRemoteHandler} from '@/remote/implementation/mouse-click-remote-handler';
import {ExecuteRemoteHandler} from '@/remote/implementation/execute-remote-handler.service';
import {TypeTextRemoteHandler} from '@/remote/implementation/type-text-remote-handler';
import {KillNameRemoteHandler} from '@/remote/implementation/kill-name-remote-handler';
import {KillPidRemoteHandler} from '@/remote/implementation/kill-pid-remote-handler';
import {ConfigModule} from '@/config/config-module';
import {LeftMouseClickRemoteHandler} from '@/remote/implementation/left-mouse-click-remote-handler';
import {Provider} from '@nestjs/common/interfaces/modules/provider.interface';
import {SemaphorModule} from '@/semaphor/semaphor.module';
import {RandomModule} from '@/random/random.module';
import {FindPidsByNameRemoteHandler} from '@/remote/implementation/find-pids-by-name-remote-handler';
import {FindProcessesWindowsRemoteHandler} from '@/remote/implementation/find-processes-windows-remote-handler';
import {FocusWindowRemoteHandler} from '@/remote/implementation/focus-window-remote-handler';
import {FindProcessWindowsRemoteHandler} from '@/remote/implementation/find-process-windows-remote-handler';
import {CommandRemoteHandler} from '@/remote/command-remote-handler';

const remoteHandlerProviders: Provider[] = [
  Logger,
  KeyPressRemoteHandler,
  FocusProcessWindowRemoteHandler,
  MouseClickRemoteHandler,
  ExecuteRemoteHandler,
  TypeTextRemoteHandler,
  KillNameRemoteHandler,
  KillPidRemoteHandler,
  LeftMouseClickRemoteHandler,
  FindPidsByNameRemoteHandler,
  FindProcessWindowsRemoteHandler,
  FindProcessesWindowsRemoteHandler,
  FocusWindowRemoteHandler,
  {
    provide: CommandRemoteHandler,
    inject: [
      KeyPressRemoteHandler,
      FocusProcessWindowRemoteHandler,
      MouseClickRemoteHandler,
      ExecuteRemoteHandler,
      TypeTextRemoteHandler,
      KillNameRemoteHandler,
      KillPidRemoteHandler,
      LeftMouseClickRemoteHandler,
      FindPidsByNameRemoteHandler,
      FindProcessWindowsRemoteHandler,
      FindProcessesWindowsRemoteHandler,
      FocusWindowRemoteHandler,
    ],
    useFactory: (
        keyPressHandler: CommandRemoteHandler,
        focusProcessWindowHandler: CommandRemoteHandler,
        mouseClickHandler: CommandRemoteHandler,
        executeHandler: CommandRemoteHandler,
        typeTextHandler: CommandRemoteHandler,
        killByNameHandler: CommandRemoteHandler,
        killByPidHandler: CommandRemoteHandler,
        leftMouseClickHandler: CommandRemoteHandler,
        findPidsByNameHandler: CommandRemoteHandler,
        findProcessWindowsHandler: CommandRemoteHandler,
        findProcessesWindowsHandler: CommandRemoteHandler,
        focusWindowHandler: CommandRemoteHandler,
    ): CommandRemoteHandler => {
      keyPressHandler
          .setNext(focusProcessWindowHandler)
          .setNext(mouseClickHandler)
          .setNext(executeHandler)
          .setNext(typeTextHandler)
          .setNext(killByNameHandler)
          .setNext(killByPidHandler)
          .setNext(leftMouseClickHandler)
          .setNext(findPidsByNameHandler)
          .setNext(findProcessWindowsHandler)
          .setNext(findProcessesWindowsHandler)
          .setNext(focusWindowHandler);
      return keyPressHandler;
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
