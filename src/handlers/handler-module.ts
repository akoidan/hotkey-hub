import {Logger, Module} from '@nestjs/common';
import {ClientModule} from '@/client/client-module';
import {KeyPressHandler} from '@/handlers/implementation/key-press-handler';
import {FocusProcessWindowHandler} from '@/handlers/implementation/focus-process-window-handler';
import {MouseClickHandler} from '@/handlers/implementation/mouse-click-handler';
import {ExecuteHandler} from '@/handlers/implementation/execute-handler';
import {TypeTextHandler} from '@/handlers/implementation/type-text-handler';
import {KillNameHandler} from '@/handlers/implementation/kill-name-handler';
import {CommandHandler} from '@/handlers/command-handler.service';
import {KillPidHandler} from '@/handlers/implementation/kill-pid-handler';
import {ConfigModule} from '@/config/config-module';
import {LeftMouseClickHandler} from '@/handlers/implementation/left-mouse-click-handler';
import {Provider} from '@nestjs/common/interfaces/modules/provider.interface';
import {SemaphorModule} from '@/semaphor/semaphor.module';
import {RandomModule} from '@/random/random.module';
import {FindPidsByNameHandler} from '@/handlers/implementation/find-pids-by-name-handler';
import {FindProcessWindowsHandler} from '@/handlers/implementation/find-process-windows-handler';
import {FindProcessesWindowsHandler} from '@/handlers/implementation/find-processes-windows-handler';
import {FocusWindowHandler} from '@/handlers/implementation/focus-window-handler';
import {EvaluateVariableHandler} from "@/handlers/implementation/evaluate-variable-handler";

const handlerProviders: Provider[] = [
  Logger,
  KeyPressHandler,
  FocusProcessWindowHandler,
  MouseClickHandler,
  ExecuteHandler,
  TypeTextHandler,
  KillNameHandler,
  KillPidHandler,
  LeftMouseClickHandler,
  FindPidsByNameHandler,
  FindProcessWindowsHandler,
  FindProcessesWindowsHandler,
  FocusWindowHandler,
  EvaluateVariableHandler,
  {
    provide: CommandHandler,
    inject: [
      KeyPressHandler,
      FocusProcessWindowHandler,
      MouseClickHandler,
      ExecuteHandler,
      TypeTextHandler,
      KillNameHandler,
      KillPidHandler,
      LeftMouseClickHandler,
      FindPidsByNameHandler,
      FindProcessWindowsHandler,
      FindProcessesWindowsHandler,
      FocusWindowHandler,
      EvaluateVariableHandler,
    ],
    useFactory: (
      keyPressHandler: CommandHandler,
      focusProcessWindowHandler: CommandHandler,
      mouseClickHandler: CommandHandler,
      executeHandler: CommandHandler,
      typeTextHandler: CommandHandler,
      killByNameHandler: CommandHandler,
      killByPidHandler: CommandHandler,
      leftMouseClickHandler: CommandHandler,
      findPidsByNameHandler: CommandHandler,
      findProcessWindowsHandler: CommandHandler,
      findProcessesWindowsHandler: CommandHandler,
      focusWindowHandler: CommandHandler,
      evaluateVariableHandler: CommandHandler,
    ): CommandHandler => {
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
        .setNext(focusWindowHandler)
        .setNext(evaluateVariableHandler);

      return keyPressHandler;
    },
  },
];

@Module({
  imports: [ClientModule, ConfigModule, SemaphorModule, RandomModule],
  providers: handlerProviders,
  exports: [CommandHandler],
})
class HandlerModule {

}

export {
  handlerProviders,
  HandlerModule,
};
