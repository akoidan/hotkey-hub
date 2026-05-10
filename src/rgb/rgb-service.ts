import {Inject, Injectable, Logger} from '@nestjs/common';
import {ConfigService} from '@/config/config-service';
import {ConnectionState, LedState, RgbServiceI} from '@/rgb/rgb-model';
import {Native, OpenRgbNativeModule, RgbColor} from '@/native/native-model';


@Injectable()
export class RgbService implements RgbServiceI {
  private readonly leds = new Map<string, LedState>();
  private deviceId: number | null = null;
  private privateState: ConnectionState = ConnectionState.INITING;
  private readonly RECONNECT_TIMEOUT = 5000;

  constructor(
    private readonly configService: ConfigService,
    @Inject(Native) private readonly native: OpenRgbNativeModule,
    private readonly logger: Logger,
  ) {
  }


  public updateColor(comb: string, color: RgbColor): void {
    if (this.state === ConnectionState.NOT_AVAILABLE) {
      this.logger.verbose('Skipping led settings, cause it\'s off');
      return;
    }
    if (this.state === ConnectionState.INITING) {
      this.logger.warn('Skipping setting led key since its still initing');
      return;
    }

    const key = comb.split('+').at(-1)!.toLowerCase();
    const state = this.leds.get(key);
    if (!state) {
      this.logger.error(`key "${key}" not in keymap`);
      return;
    }
    state.color = color;

    if (this.state === ConnectionState.CONNECTED) {
      try {
        this.native.rgbUpdateSingleLed(this.deviceId!, state.ledIndex, state.color);
      } catch (error) {
        this.logger.error(`Error while setting led ${error}`);
        this.state = ConnectionState.NOT_AVAILABLE;  // block further sends; DC event triggers reconnect
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
      await this.native.rgbConnect(rgb.serverAddr!, rgb.serverPort!, rgb.clientName!);

      const devices = await this.native.rgbGetDevices();
      const keyboard = devices.find(dev => dev.name === rgb.deviceName);
      this.logger.debug(`RGB devices: ${devices.map(d => d.name).join(', ')}. Using: ${keyboard?.name ?? 'none'}`);
      if (!keyboard) {
        throw new Error(`Device "${rgb.deviceName}" not found`);
      }
      this.deviceId = keyboard.deviceId;
      this.leds.clear();
      const {offLed} = this.configService.getOpenRgb()!;
      keyboard.leds.forEach((led, i) => {
        this.leds.set(this.encodeKey(led.name), {ledIndex: i, color: offLed!});
      });
      this.logger.debug('Subscribed to disconnect event');
      this.native.rgbRegisterDCEvent(() =>  void this.onRgbDisconnect());
      this.native.rgbSetCustomMode(this.deviceId!);
      this.native.rgbUpdateAllLeds(this.deviceId!, this.colorsArray);
      this.state = ConnectionState.CONNECTED;
      return true;
    } catch (error) {
      this.logger.error(`Unable to initialize OpenRGB service: ${error?.message ?? error}.`
        + ` Retrying initialization in ${this.RECONNECT_TIMEOUT}ms`, error.stack);
      this.state = ConnectionState.NOT_AVAILABLE;
      setTimeout(() => void this.setup(), this.RECONNECT_TIMEOUT);
      return false;
    }
  }

  private get colorsArray(): RgbColor[] {
    const {offLed} = this.configService.getOpenRgb()!;
    const colors = Array<RgbColor>(this.leds.size).fill(offLed!);
    for (const state of this.leds.values()) {
      colors[state.ledIndex] = state.color;
    }
    return colors;
  }

  get state(): ConnectionState {
    return this.privateState;
  }

  set state(state: ConnectionState) {
    if (state === ConnectionState.CONNECTING) {
      this.logger.error('Lost connection to openRGB');
    } else if (state === ConnectionState.CONNECTED) {
      this.logger.debug('Connected to OpenRGB');
    } else if (this.state === ConnectionState.NOT_AVAILABLE) {
      this.logger.debug('Stopping openRGB service');
    }
    this.privateState = state;
  }

  private async onRgbDisconnect(): Promise<void> {
    try {
      this.state = ConnectionState.CONNECTING;
      await new Promise(r => {
        setTimeout(r, this.RECONNECT_TIMEOUT);
      });
      this.logger.debug('Trying to reconnect to OpenRGB');
      const rgb = this.configService.getOpenRgb()!;
      // will triggger onDC which will call this function
      await this.native.rgbConnect(rgb.serverAddr!, rgb.serverPort!, rgb.clientName!);
      this.native.rgbSetCustomMode(this.deviceId!);
      this.native.rgbUpdateAllLeds(this.deviceId!, this.colorsArray);
      this.state = ConnectionState.CONNECTED;
    } catch (e) {
      this.logger.error(`Unable to reconnect to OpenRGB: ${e}, retrying in ${this.RECONNECT_TIMEOUT}`);
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
