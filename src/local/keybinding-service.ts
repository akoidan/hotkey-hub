import {Inject, Logger} from '@nestjs/common';
import {ConfigService} from '@/config/config-service';
import {ClientService} from '@/client/client-service';
import clc from 'cli-color';
import {INativeModule, ModifierKey, Native} from '@/native/native-model';
import {ShortcutDescription} from '@/app/app-model';
import {ShortcutProcessingService} from '@/local/shortcut-processing.service';


export class KeybindingService {
  private readonly callbacks: Record<string, ShortcutDescription> = {};

  constructor(
    private readonly logger: Logger,
    private readonly configService: ConfigService,
    private readonly clientService: ClientService,
    private readonly shortcutProcessingService: ShortcutProcessingService,
    @Inject(Native)
    private readonly native: INativeModule
  ) {
  }


  async reloadShortcuts(): Promise<void> {
    await this.configService.parseConfig();
    await this.registerShortcuts();
  }

  async registerShortcuts(): Promise<void> {
    try {
      await Promise.all(
        Object.keys(this.configService.getIps())
          .map(async(destination) => this.clientService.ping(destination))
      );
      const allNewShortcuts = new Set<string>();
      for (const comb of this.configService.getCombinations()) {
        try {
          this.logger.debug(`Registering ${clc.bold.green(comb.shortCut)} shortcut`);
          const {modifiers, key, name} = this.normalizeShortcut(comb.shortCut);
          allNewShortcuts.add(name);
          if (this.callbacks[name]) {
            this.logger.debug(`Reloaded ${name}`);
            this.callbacks[name] = {
              id: this.callbacks[name].id,
              shortcut: comb,
            };
          } else {
            this.logger.debug(`Registered ${name}`);
            const id = this.native.registerHotkey(key, modifiers, () => {
              this.shortcutProcessingService.runShortcut(this.callbacks[name].shortcut).catch(err => this.logger.error(err));
            });
            this.callbacks[name] = {
              id,
              shortcut: comb,
            };
          }
        } catch (e) {
          throw new Error(`Unable to register ${comb.shortCut} because ${e.message}`);
        }
      }
      for (const [oldCb, oldCbValue] of Object.entries(this.callbacks)) {
        if (!allNewShortcuts.has(oldCb)) {
          this.native.unregisterHotkey(oldCbValue.id);
          delete this.callbacks[oldCb];
        }
      }
    } catch (err) {
      this.logger.error(`Unable to init main module: ${(err as Error).message}`, (err as Error).stack);
      this.native.cleanupHotkeys();
      throw err;
    }
  }

  private normalizeShortcut(shortCut: string) {
    const modifiers: ModifierKey[] = shortCut.split('+').map(a => a.toLowerCase()) as ModifierKey[];
    const key = modifiers.pop() as string;
    modifiers.sort();
    const name = `${modifiers.join('+')}+${key}`;
    return {modifiers, key, name};
  }
}
