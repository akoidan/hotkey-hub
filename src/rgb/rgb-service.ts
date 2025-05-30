import {
  Injectable,
  Logger,
} from '@nestjs/common';
import {Client} from 'openrgb-sdk';
import ClientType from 'openrgb-sdk/types/client';
import {ConfigService} from '@/config/config-service';


interface Color {
  red: number;
  green: number;
  blue: number;
}

@Injectable()
export class RgbService {
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
      this.client!.updateLeds(this.deviceId, this.colors!);
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
      await this.client.connect();
      this.logger.debug('Connected to OpenRGB...');
      const controllerData = await this.client.getAllControllerData();
      const device = controllerData.find(dev => dev.name === rgb.deviceName);
      if (!device) {
        throw new Error(`"Unable to find device with name "${rgb.deviceName}",
         available options "${controllerData.map(dev => dev.name).join('", "')}"`);
      }
      this.deviceId = device.deviceId as number;
      this.logger.debug(controllerData);
      const keyboard = await this.client.getControllerData(this.deviceId!);
      if (!keyboard) {
        throw Error(`Unable to find devicesId ${this.deviceId}`);
      }
      this.logger.debug('Found keyboard:', keyboard.type);
      await this.client.updateMode(this.deviceId!, 'Direct', {});
      this.logger.debug('Resetting rgb colors...');
      keyboard.leds.forEach((led, index: number) => {
        // Strip 'Key: ' prefix and convert to uppercase
        this.keyMap[led.name.replace('Key: ', '').toLowerCase()] = index;
      });
      this.colors = Array<Color>(keyboard.colors.length).fill({red: 0, green: 0, blue: 0});
      this.client.updateLeds(this.deviceId!, this.colors);
      this.logger.debug('Setting colors...');

    } catch (error) {
      this.logger.error(`Unable to init keyboard because of ${error?.message ?? error}`, error.stack);
    }
  }
}
