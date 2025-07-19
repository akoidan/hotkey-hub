import {Logger, Module} from '@nestjs/common';
import {ClientModule} from '@/client/client-module';
import {KeyPressRemoteHandler} from '@/handlers/implementation/key-press-remote-handler';
import {FocusProcessWindowRemoteHandler} from '@/handlers/implementation/focus-process-window-remote-handler';
import {MouseClickRemoteHandler} from '@/handlers/implementation/mouse-click-remote-handler';
import {ExecuteRemoteHandler} from '@/handlers/implementation/execute-remote-handler.service';
import {TypeTextRemoteHandler} from '@/handlers/implementation/type-text-remote-handler';
import {KillNameRemoteHandler} from '@/handlers/implementation/kill-name-remote-handler';
import {KillPidRemoteHandler} from '@/handlers/implementation/kill-pid-remote-handler';
import {ConfigModule} from '@/config/config-module';
import {LeftMouseClickRemoteHandler} from '@/handlers/implementation/left-mouse-click-remote-handler';
import {Provider} from '@nestjs/common/interfaces/modules/provider.interface';
import {SemaphorModule} from '@/semaphor/semaphor.module';
import {RandomModule} from '@/random/random.module';
import {FindPidsByNameRemoteHandler} from '@/handlers/implementation/find-pids-by-name-remote-handler';
import {FindProcessesWindowsRemoteHandler} from '@/handlers/implementation/find-processes-windows-remote-handler';
import {FocusWindowRemoteHandler} from '@/handlers/implementation/focus-window-remote-handler';
import {FindProcessWindowsRemoteHandler} from '@/handlers/implementation/find-process-windows-remote-handler';
import {CommandRemoteHandler} from '@/handlers/command-remote-handler';

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
