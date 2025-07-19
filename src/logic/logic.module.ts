import {Logger, Module} from '@nestjs/common';
import {ConfigModule} from '@/config/config-module';
import {ClientModule} from '@/client/client-module';
import {ShortcutProcessingService} from '@/logic/shortcut-processing.service';
import {VariableResolutionService} from '@/logic/variable-resolution.service';
import {RemoteHandlerModule} from '@/handlers/remote-handler-module';
import {RemoteCommandHandler} from '@/logic/implementation/remote-command-handler';
import {DelayService} from '@/logic/delay.service';
import {SemaphorModule} from '@/semaphor/semaphor.module';
import {RandomModule} from '@/random/random.module';
import {Provider} from '@nestjs/common/interfaces/modules/provider.interface';
import {BaseLocalHandler} from '@/logic/implementation/base-local-handler';
import {MacroLocalHandler} from '@/logic/implementation/macro-local-handler';
import {TransactionLocalHandler} from '@/logic/implementation/transaction-local-handler';
import {ExpressionLocalHandler} from '@/logic/implementation/expression-local-handler';
import {ThreadsLocalHandler} from '@/logic/implementation/threads-local-handler';


const processingProviders: Provider[] = [
  MacroLocalHandler,
  TransactionLocalHandler,
  ExpressionLocalHandler,
  RemoteCommandHandler,
  ThreadsLocalHandler,
  {
    provide: BaseLocalHandler,
    inject: [
      MacroLocalHandler,
      TransactionLocalHandler,
      ExpressionLocalHandler,
      ThreadsLocalHandler,
      RemoteCommandHandler,
    ],
    useFactory: (
      macro: BaseLocalHandler,
      transaction: BaseLocalHandler,
      variable: BaseLocalHandler,
      thread: BaseLocalHandler,
      command: BaseLocalHandler,
    ): BaseLocalHandler => {
      macro.setNext(transaction, macro)
        .setNext(variable, macro)
        .setNext(thread, macro)
        .setNext(command, macro)
        .setNext(null!, macro);
      return macro;
    },
  },
];

@Module({
  imports: [ConfigModule, ClientModule, RemoteHandlerModule, SemaphorModule, RandomModule],
  providers: [
    Logger,
    DelayService,
    ShortcutProcessingService,
    VariableResolutionService,
    RemoteCommandHandler,
    ...processingProviders,
  ],
  exports: [ShortcutProcessingService],
})
class LogicModule {

}

export {LogicModule, processingProviders};
