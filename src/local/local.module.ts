import {Logger, Module, OnModuleInit} from '@nestjs/common';
import {ConfigModule} from '@/config/config-module';
import {ClientModule} from '@/client/client-module';
import {ShortcutProcessingService} from '@/local/shortcut-processing.service';
import {VariableResolutionService} from '@/local/variable-resolution.service';
import {RemoteHandlerModule} from '@/remote/remote-handler-module';
import {CommandLocalHandler} from '@/local/command-local-handler';
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
import {EvaluateService} from '@/local/evaluate-serivce';
import {IfLocalHandler} from '@/local/implementation/if-local-handler';
import {ShuffleLocalHandler} from '@/local/implementation/shuffle-local-handler';
import {PrintLocalHandler} from '@/local/implementation/print-local-handler';
import {GetLocalHandler} from '@/local/get-local-handler';
import {GetInfoModule} from '@/get-info/get-info-module';
import {ExceptionLocalHandler} from '@/local/implementation/exception-local-handler';
import {AsyncStorageModule} from '@/asyncstore/async-storage.module';


const localHandlers =[
  MacroLocalHandler,
  TransactionLocalHandler,
  ExpressionLocalHandler,
  ThreadsLocalHandler,
  LoopLocalHandler,
  ReloadLocalHandler,
  IfLocalHandler,
  ShuffleLocalHandler,
  PrintLocalHandler,
  GetLocalHandler,
  ExceptionLocalHandler,
  CommandLocalHandler,
];

const localProviders: Provider[] = [
  ...localHandlers,
  {
    provide: BaseLocalHandler,
    inject: localHandlers,
    useFactory: (...lhandl: BaseLocalHandler[]): BaseLocalHandler => {
      for (let i = 0; i < lhandl.length - 1; i++) {
        lhandl[i].setNext(lhandl[i + 1], lhandl[0]);
      }
      lhandl[lhandl.length -1].setNext(null!, lhandl[0]);
      return lhandl[0];
    },
  },
];

@Module({
  imports: [
    ConfigModule,
    ClientModule,
    RemoteHandlerModule,
    SemaphorModule,
    RandomModule,
    RgbModule,
    NativeModule,
    GetInfoModule,
    AsyncStorageModule,
  ],
  providers: [
    Logger,
    DelayService,
    KeybindingService,
    ShortcutProcessingService,
    VariableResolutionService,
    EvaluateService,
    CommandLocalHandler,
    ...localProviders,
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

export {LocalModule, localProviders};
