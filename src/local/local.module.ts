import {Logger, Module, OnModuleInit} from '@nestjs/common';
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
import {BaseLocalHandler} from '@/local/base-local-handler';
import {MacroLocalHandler} from '@/local/implementation/macro-local-handler';
import {TransactionLocalHandler} from '@/local/implementation/transaction-local-handler';
import {ExpressionLocalHandler} from '@/local/implementation/expression-local-handler';
import {ThreadsLocalHandler} from '@/local/implementation/threads-local-handler';
import {LoopLocalHandler} from '@/local/implementation/loop-local-handler';
import {RgbModule} from '@/rgb/rgb.module';
import {KeybindingService} from '@/local/keybinding-service';
import {ReloadLocalHandler} from '@/local/implementation/reload-local-handler';
import {NativeModule} from '@/native/native-module';


const processingProviders: Provider[] = [
  MacroLocalHandler,
  TransactionLocalHandler,
  ExpressionLocalHandler,
  CommandLocalHandler,
  ThreadsLocalHandler,
  LoopLocalHandler,
  ReloadLocalHandler,
  {
    provide: BaseLocalHandler,
    inject: [
      MacroLocalHandler,
      TransactionLocalHandler,
      ExpressionLocalHandler,
      ThreadsLocalHandler,
      LoopLocalHandler,
      ReloadLocalHandler,
      CommandLocalHandler,
    ],
    useFactory: (
      macro: BaseLocalHandler,
      transaction: BaseLocalHandler,
      variable: BaseLocalHandler,
      thread: BaseLocalHandler,
      loopLocalHandler: BaseLocalHandler,
      reloadLocalHandler: ReloadLocalHandler,
      command: BaseLocalHandler,
    ): BaseLocalHandler => {
      macro.setNext(transaction, macro)
        .setNext(variable, macro)
        .setNext(thread, macro)
        .setNext(loopLocalHandler, macro)
        .setNext(reloadLocalHandler, macro)
        .setNext(command, macro)
        .setNext(null!, macro);
      return macro;
    },
  },
];

@Module({
  imports: [ConfigModule, ClientModule, RemoteHandlerModule, SemaphorModule, RandomModule, RgbModule, NativeModule],
  providers: [
    Logger,
    DelayService,
    KeybindingService,
    ShortcutProcessingService,
    VariableResolutionService,
    CommandLocalHandler,
    ...processingProviders,
  ],
  exports: [KeybindingService],
})
class LocalModule implements OnModuleInit {
  constructor(
    private readonly rlh: ReloadLocalHandler,
    private readonly kbs: KeybindingService
  ) {
  }

  onModuleInit(): void {
   this.rlh.setKeyBindingService(this.kbs);
  }
}

export {LocalModule, processingProviders};
