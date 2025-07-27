import {Inject, Logger, Module, OnModuleInit} from '@nestjs/common';
import {ConfigModule} from '@/config/config-module';
import {ConfigService} from '@/config/config-service';
import {ClientModule} from '@/client/client-module';
import {ClientService} from '@/client/client-service';
import {ShortcutProcessingService} from '@/local/shortcut-processing.service';
import {LocalModule} from '@/local/local.module';
import {NativeModule} from '@/native/native-module';
import clc from 'cli-color';
import {INativeModule, ModifierKey, Native} from '@/native/native-model';
import {Shortcut} from '@/config/types/shortcut';

@Module({
  imports: [ConfigModule, ClientModule, LocalModule, NativeModule],
  providers: [Logger],
  exports: [],
})
export class AppModule implements OnModuleInit {
  constructor(
    private readonly logger: Logger,
    private readonly logicService: ShortcutProcessingService,
    private readonly configService: ConfigService,
    private readonly clientService: ClientService,
    @Inject(Native)
    private readonly native: INativeModule
  ) {
  }

  async onModuleInit(): Promise<void> {
    try {
      this.logger.debug('Initializing app...');
      await Promise.all(
        Object.keys(this.configService.getIps())
          .map(async(desination) => this.clientService.ping(desination))
      );
      this.configService.getCombinations().forEach((comb: Shortcut) => {
        try {
          this.logger.debug(`Registering ${clc.bold.green(comb.shortCut)} shortcut`);
          const modifiers: ModifierKey[] = comb.shortCut.split('+').map(a => a.toLowerCase()) as ModifierKey[];
          const key = modifiers.pop() as string;
          this.native.registerHotkey(key, modifiers, () => {
            this.logicService.runShortcut(comb).catch((err: unknown) => this.logger.error(err));
          });
        } catch (e) {
          throw new Error(`Unable to register ${comb.shortCut} becase ${e.message}`);
        }
      });
      const shorcuts = this.configService.getCombinations().map(a => a.shortCut);
      this.logger.log(`App has sucessfully started with following shorcuts: ${clc.bold.green(shorcuts.join(' '))}`);
    } catch (err) {
      this.logger.error(`Unable to init main module: ${(err as Error).message}`, (err as Error).stack);
      this.native.cleanupHotkeys();
    }
  }
}
