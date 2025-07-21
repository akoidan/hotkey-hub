import {Logger, Module} from '@nestjs/common';
import {ConfigModule} from '@/config/config-module';
import {ClientModule} from '@/client/client-module';
import {ShortcutProcessingService} from '@/local/shortcut-processing.service';
import {VariableResolutionService} from '@/local/variable-resolution.service';
import {RemoteHandlerModule} from '@/remote/remote-handler-module';
import {CommandLocalHandler} from '@/local/implementation/command-local-handler';
import {DelayService} from '@/local/delay.service';
import {SemaphorModule} from '@/semaphor/semaphor.module';
import {RandomModule} from '@/random/random.module';
import {Provider} from '@nestjs/common/interfaces/modules/provider.interface';
import {BaseLocalHandler} from '@/local/implementation/base-local-handler';
import {MacroLocalHandler} from '@/local/implementation/macro-local-handler';
import {TransactionLocalHandler} from '@/local/implementation/transaction-local-handler';
import {ExpressionLocalHandler} from '@/local/implementation/expression-local-handler';
import {ThreadsLocalHandler} from '@/local/implementation/threads-local-handler';
import {LoopLocalHandler} from "@/local/implementation/loop-local-handler";


const processingProviders: Provider[] = [
  MacroLocalHandler,
  TransactionLocalHandler,
  ExpressionLocalHandler,
  CommandLocalHandler,
  ThreadsLocalHandler,
  LoopLocalHandler,
  {
    provide: BaseLocalHandler,
    inject: [
      MacroLocalHandler,
      TransactionLocalHandler,
      ExpressionLocalHandler,
      ThreadsLocalHandler,
      LoopLocalHandler,
      CommandLocalHandler,
    ],
    useFactory: (
      macro: BaseLocalHandler,
      transaction: BaseLocalHandler,
      variable: BaseLocalHandler,
      thread: BaseLocalHandler,
      loopLocalHandler: BaseLocalHandler,
      command: BaseLocalHandler,
    ): BaseLocalHandler => {
      macro.setNext(transaction, macro)
        .setNext(variable, macro)
        .setNext(thread, macro)
        .setNext(loopLocalHandler, macro)
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
    CommandLocalHandler,
    ...processingProviders,
  ],
  exports: [ShortcutProcessingService],
})
class LocalModule {

}

export {LocalModule, processingProviders};
