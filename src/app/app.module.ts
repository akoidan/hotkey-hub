import {
  Logger,
  Module,
  OnModuleInit,
} from '@nestjs/common';
import {HotkeyService} from '@/app/hotkey.service';
import {ConfigModule} from '@/config/config-module';
import {ConfigService} from '@/config/config-service';
import {ClientModule} from '@/client/client-module';
import {ClientService} from '@/client/client-service';
import {ShortcutProcessingService} from '@/logic/shortcut-processing.service';
import {LogicModule} from '@/logic/logic.module';
import {NativeModule} from '@/native/native-module';
import clc from 'cli-color';
import {MutexService} from '@/mutex/mutex.service';
import {MutexModule} from '@/mutex/mutex.module';

@Module({
  imports: [ConfigModule, ClientModule, LogicModule, NativeModule, MutexModule],
  providers: [Logger, HotkeyService],
  exports: [],
})
export class AppModule implements OnModuleInit {
  constructor(
    private readonly logger: Logger,
    private readonly hotKeyService: HotkeyService,
    private readonly logicService: ShortcutProcessingService,
    private readonly configService: ConfigService,
    private readonly clientService: ClientService,
    private readonly semaphorService: MutexService
  ) {
  }

  async onModuleInit(): Promise<void> {
    try {
      this.logger.debug('Initializing app...');
      await Promise.all(
        Object.keys(this.configService.getIps())
          .map(async(desination) => this.clientService.ping(desination))
      );
      this.configService.getCombinations().forEach((comb) => {
        this.hotKeyService.registerShortcut(comb.shortCut, () => {
          this.semaphorService.startTransaction(comb.shortCut, async() => {
            try {
              await this.logicService.processUnknownShortCut(comb);
            } catch (err) {
              this.logger.error(err);
            } finally {
              this.semaphorService.commitTransaction();
            }
          });
        });
      });
      const shorcuts = this.configService.getCombinations().map(a => a.shortCut);
      this.logger.log(`App has sucessfully started with following shorcuts: ${clc.bold.green(shorcuts.join(' '))}`);
    } catch (err) {
      this.logger.error(`Unable to init main module: ${(err as Error).message}`, (err as Error).stack);
      this.hotKeyService.unregister();
    }
  }
}
