import {Logger, Module} from '@nestjs/common';
import {ConfigModule} from '@/config/config-module';
import {ClientModule} from '@/client/client-module';
import {ShortcutProcessingService} from '@/logic/shortcut-processing.service';
import {VariableResolutionService} from '@/logic/variable-resolution.service';
import {HandlerModule} from '@/handlers/handler-module';
import {CommandProcessingService} from '@/logic/implementation/command-processing.service';
import {DelayService} from '@/logic/delay.service';
import {SemaphorModule} from '@/semaphor/semaphor.module';
import {RandomModule} from '@/random/random.module';
import {Provider} from '@nestjs/common/interfaces/modules/provider.interface';
import {BaseProcessingService} from '@/logic/implementation/base-processing.service';
import {MacroProcessingService} from '@/logic/implementation/macro-processing.service';
import {TransactionProcessingService} from '@/logic/implementation/transaction-processing.service';
import {VariableProcessingService} from "@/logic/implementation/variable-processing.service";


const processingProviders: Provider[] = [
  MacroProcessingService,
  TransactionProcessingService,
  VariableProcessingService,
  CommandProcessingService,
  {
    provide: BaseProcessingService,
    inject: [
      MacroProcessingService,
      TransactionProcessingService,
      VariableProcessingService,
      CommandProcessingService,
    ],
    useFactory: (
      macro: BaseProcessingService,
      transaction: BaseProcessingService,
      variable: BaseProcessingService,
      command: BaseProcessingService,
    ): BaseProcessingService => {
       macro.setNext(transaction, macro)
        .setNext(variable, macro)
        .setNext(command, macro)
        .setNext(null!, macro);
      return macro;
    },
  },
];

@Module({
  imports: [ConfigModule, ClientModule, HandlerModule, SemaphorModule, RandomModule],
  providers: [
    Logger,
    DelayService,
    ShortcutProcessingService,
    VariableResolutionService,
    CommandProcessingService,
    ...processingProviders,
  ],
  exports: [ShortcutProcessingService],
})
class LogicModule {

}

export {LogicModule, processingProviders};
