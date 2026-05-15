import {Inject, Logger} from '@nestjs/common';
import {ConfigService} from '@/config/config-service';
import {ClientService} from '@/client/client-service';
import clc from 'cli-color';
import {INativeModule, ModifierKey, Native} from '@/native/native-model';
import {ShortcutDescription, VERSION_INJ} from '@/app/app-model';
import {ShortcutProcessingService} from '@/local/shortcut-processing.service';
import {Shortcut} from '@/config/types/shortcut';


export class KeybindingService {
  private readonly callbacks: Record<string, ShortcutDescription> = {};

  constructor(
    private readonly logger: Logger,
    @Inject(VERSION_INJ)
    private readonly version: string,
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

  async pingClients(): Promise<void> {
    await Promise.all(
      Object.keys(this.configService.getIps())
        .map(async(destination) => {
          await this.verifyClientVersion(destination);
        })
    );
  }

  private async verifyClientVersion(destination: string): Promise<void> {
    const res = await this.clientService.app.ping(destination, {timeout: 3000});
    const [major] = this.version.split('.');
    let clientVersion = '1.x.x';
    if (res.version) {
      clientVersion = res.version;
      const [resMajor] = res.version.split('.');
      if (resMajor === major) {
        return;
      }
    }
    throw new Error(`Unsupported client version ${clientVersion}, expected ${major}.x.x`);
  }

  unregisterShortcuts(): void {
    // eslint-disable-next-line guard-for-in
    for (const key in this.callbacks) {
      this.native.unregisterHotkey(this.callbacks[key].id);
    };
  }

  async registerShortcuts(): Promise<void> {
    await this.pingClients();
    const allNewShortcuts = new Set<string>();
    for (const comb of this.configService.getCombinations()) {
      try {
        const name = this.registerShorCut(comb);
        allNewShortcuts.add(name);
      } catch (e: any) {
        throw new Error(`Unable to register ${comb.shortCut} because ${e.message}`);
      }
    }
    for (const [oldCb, oldCbValue] of Object.entries(this.callbacks)) {
      if (!allNewShortcuts.has(oldCb)) {
        this.native.unregisterHotkey(oldCbValue.id);
        // eslint-disable-next-line  @typescript-eslint/no-dynamic-delete
        delete this.callbacks[oldCb];
        this.logger.debug(`Unregistering ${clc.bold.green(oldCbValue.shortcut.shortCut)} shortcut`);
      }
    }
  }

  private registerShorCut(comb: Shortcut): string {
    const modifiers: ModifierKey[] = comb.shortCut.split('+').map(a => a.toLowerCase()) as ModifierKey[];
    const key = modifiers.pop() as string;
    modifiers.sort();
    const name = `${modifiers.join('+')}+${key}`;
    if (this.callbacks[name]) {
      this.logger.debug(`Reloading ${clc.green(comb.shortCut)} shortcut body`);
      this.callbacks[name] = {
        id: this.callbacks[name].id,
        shortcut: comb,
      };
    } else {
      this.logger.debug(`Registering ${clc.bold.green(comb.shortCut)} shortcut`);
      const id = this.native.registerHotkey(key, modifiers, () => {
        this.shortcutProcessingService.runShortcut(this.callbacks[name].shortcut).catch((err: unknown) => {
          this.logger.error(err);
        });
      });
      this.callbacks[name] = {
        id,
        shortcut: comb,
      };
    }
    return name;
  }
}
