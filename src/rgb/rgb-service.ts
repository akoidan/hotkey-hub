import {
  Injectable,
  Logger,
} from '@nestjs/common';
import {Client} from 'openrgb-sdk';
import ClientType from 'openrgb-sdk/types/client';
import {ConfigService} from '@/config/config-service';
import {RgbServiceI} from '@/rgb/rgb-model';


interface Color {
  red: number;
  green: number;
  blue: number;
}

@Injectable()
export class RgbService implements RgbServiceI {
  private colors: Color[] | null = null;
  private client: ClientType | null = null;
  private keyMap: Record<string, number> = {};
  private deviceId: number | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: Logger,
  ) {
  }

  public async updateColors(comb: string, hl: boolean): Promise<void> {
    if (this.deviceId === null) {
      return;
    }
    const keys = comb.split('+');
    const key = keys[keys.length - 1].toLowerCase();
    if (!this.keyMap[key]) {
      this.logger.error(`key ${key} is not present in keymap ${JSON.stringify(this.keyMap)}`);
      return;
    }
    if (hl) {
      this.colors![this.keyMap[key]] = {
        red: 255,
        green: 0,
        blue: 0,
      };
    } else {
      this.colors![this.keyMap[key]] = {
        red: 0,
        green: 0,
        blue: 0,
      };
    }
    try {
      if (!this.client!.isConnected) {
        this.logger.debug('Connecting to OpenRGB...');
        await this.client!.connect();
      }
      this.client!.updateSingleLed(this.deviceId, this.keyMap[key], this.colors![this.keyMap[key]!]!);
    } catch (error) {
      this.logger.error(`Unable to update leds because of ${error.message ?? error}, launching setup again`, error.stack);
      await this.setup();
    }
  }

  public async setup(): Promise<void> {
    const rgb = this.configService.getOpenRgb();
    if (!rgb) {
      this.logger.debug('Openrgb is not defined, returning');
      return;
    }
    this.client = new Client(rgb.clientName ?? 'PRC', rgb.serverPort ?? 6742, rgb.serverAddr ?? 'localhost');

    try {
      this.logger.debug('Connecting to OpenRGB...');
      await this.client!.connect();
      this.logger.debug('Connected to OpenRGB...');
      const controllerData = await this.client.getAllControllerData();
      const keyboard = controllerData.find(dev => dev.name === rgb.deviceName);
      const availableDevices = controllerData.map(dev => dev.name).join('", "');
      this.logger.debug(`Available RGB devices: ${availableDevices}. Our device is ${keyboard?.deviceId}`);
      if (!keyboard) {
        throw new Error(`"Unable to find device with name "${rgb.deviceName}"`);
      }

      this.deviceId = keyboard.deviceId as number;
      await this.client!.updateMode(this.deviceId!, 'Direct', {});
      keyboard.leds.forEach((led, index: number) => {
        // Strip 'Key: ' prefix and convert to uppercase
        this.keyMap[this.encodeKey(led)] = index;
      });
      this.colors = Array<Color>(keyboard.colors.length).fill({red: 0, green: 0, blue: 0});
      // this hack is required because otherwise TCP socket error would be throws to unhandled error
      this.client!.disconnect();
      await this.client!.connect();
      // remove this hack when openrgb-sdk is fixed
      this.logger.debug('Setting keyboard colors...');
      this.client!.updateLeds(this.deviceId!, this.colors);
    } catch (error) {
      this.logger.error(`Unable to init keyboard because of ${error?.message ?? error}`, error.stack);
    }
  }

  private encodeKey(led: { name: string; value: { red: any; green: any; blue: any } }): string {
    // mapiing for HyperX Alloy keyboard
    return led.name
        .toLowerCase()
        .replace(' arrow', '')
        .replace('key: ', '')
        .replace(' (ansi)', '')
        .replace(' ', '_');
  }
}
