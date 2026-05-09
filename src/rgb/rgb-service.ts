import {Inject, Injectable, Logger} from '@nestjs/common';
import {ConfigService} from '@/config/config-service';
import {ConnectionState, LedState, RgbServiceI} from '@/rgb/rgb-model';
import {Native, OpenRgbNativeModule, RgbColor} from '@/native/native-model';


@Injectable()
export class RgbService implements RgbServiceI {
  private readonly leds = new Map<string, LedState>();
  private deviceId: number | null = null;
  private state: ConnectionState = ConnectionState.INITING;
  private readonly RECONNECT_TIMEOUT = 5000;
  private readonly OFF: RgbColor = {red: 0, green: 0, blue: 0};
  private readonly ON: RgbColor = {red: 255, green: 0, blue: 0};

  constructor(
    private readonly configService: ConfigService,
    @Inject(Native) private readonly native: OpenRgbNativeModule,
    private readonly logger: Logger,
  ) {
  }


  public updateColors(comb: string, hl: boolean): void {
    if (this.state === ConnectionState.NOT_AVAILABLE) {
      return;
    }

    const key = comb.split('+').at(-1)!.toLowerCase();
    const state = this.leds.get(key);
    if (!state) {
      this.logger.error(`key "${key}" not in keymap`);
      return;
    }
    const stateBefore = state.refCount;
    if (hl) {
      state.refCount++;
    } else {
      state.refCount--;
    }
    if (state.refCount < 0) {
      throw Error('Bug in stateCount per led');
    }
    state.color = state.refCount > 0 ? this.ON : this.OFF;

    // if before was 0, we definitely change state
    // if it become 0, this means before it was 1
    if ((stateBefore === 0 || state.refCount === 0) && this.state === ConnectionState.CONNECTED) {
      try {
        this.native.rgbUpdateSingleLed(this.deviceId!, state.ledIndex, state.color);
      } catch (error) {
        this.logger.error(`Error while setting led ${error}`);
        void this.reconnect();
      }
    }
  }

  // eslint-disable-next-line max-statements
  public async setup(): Promise<boolean> {
    const rgb = this.configService.getOpenRgb();
    if (!rgb) {
      this.state = ConnectionState.NOT_AVAILABLE;
      this.logger.debug('OpenRGB not configured, skipping');
      return false;
    }
    try {
      this.logger.verbose('Connecting to OpenRGB...');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      try {
        await this.native.rgbConnect(rgb.serverAddr!, rgb.serverPort!, rgb.clientName!);
      } catch (e) {
        this.logger.error(`Unable to connect to openRGB, because ${e}, reconnecting in ${this.RECONNECT_TIMEOUT}ms`);
        setTimeout(() => void this.setup(), this.RECONNECT_TIMEOUT);
        return false;
      }
      const devices = await this.native.rgbGetDevices();
      const keyboard = devices.find(dev => dev.name === rgb.deviceName);
      this.logger.debug(`RGB devices: ${devices.map(d => d.name).join(', ')}. Using: ${keyboard?.name ?? 'none'}`);
      if (!keyboard) {
        throw new Error(`Device "${rgb.deviceName}" not found`);
      }
      this.deviceId = keyboard.deviceId;
      this.leds.clear();
      keyboard.leds.forEach((led, i) => {
        this.leds.set(this.encodeKey(led.name), {ledIndex: i, color: this.OFF, refCount: 0});
      });
      this.state = ConnectionState.CONNECTING;
      this.native.rgbSetCustomMode(this.deviceId!);
      this.native.rgbUpdateAllLeds(this.deviceId!, this.colorsArray);
      this.state = ConnectionState.CONNECTED;
      return true;
    } catch (error) {
      this.state = ConnectionState.NOT_AVAILABLE;
      this.logger.error(`Unable to init keyboard: ${error?.message ?? error}`, error.stack);
      return false;
    }
  }

  private get colorsArray(): RgbColor[] {
    const colors = Array<RgbColor>(this.leds.size).fill(this.OFF);
    for (const state of this.leds.values()) {
      colors[state.ledIndex] = state.color;
    }
    return colors;
  }

  private async reconnect(): Promise<void> {
    try {
      this.state = ConnectionState.CONNECTING;
      const rgb = this.configService.getOpenRgb()!;
      await this.native.rgbConnect(rgb.serverAddr!, rgb.serverPort!, rgb.clientName!);
      this.native.rgbSetCustomMode(this.deviceId!);
      this.native.rgbUpdateAllLeds(this.deviceId!, this.colorsArray);
      this.state = ConnectionState.CONNECTED;
    } catch (e) {
      this.logger.error(`Unable to reconnect: ${e}, retrying in ${this.RECONNECT_TIMEOUT}`);
      setTimeout(() => void this.reconnect(), this.RECONNECT_TIMEOUT);
    }
  }

  private encodeKey(ledName: string): string {
    const {keyMapFn} = this.configService.getOpenRgb()!;
    if (keyMapFn) {
      // eslint-disable-next-line @typescript-eslint/no-implied-eval,no-new-func
      return (new Function('x', `return (${keyMapFn});`))(ledName) as string;
    }
    return ledName;
  }
}
