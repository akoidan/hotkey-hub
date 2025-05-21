import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { Client } from 'openrgb-sdk';
import ClientType from 'openrgb-sdk/types/client';
import { ConfigService } from '@/config/config-service';


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

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: Logger,
  ) {
  }

  public async updateColors(comb: string, hl: boolean): Promise<void> {
    const rgb = this.configService.getOpenRgb();
    if (!rgb) {
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
    await this.client!.connect();
    this.client!.updateLeds(rgb.deviceId, this.colors!);
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

      const keyboard = await this.client.getControllerData(rgb.deviceId);

      if (keyboard) {
        this.logger.debug('Found keyboard:', keyboard.type);
        await this.client.updateMode(rgb.deviceId, 'Direct', {});
        this.logger.debug('Resetting rgb colors...');
        keyboard.leds.forEach((led, index: number) => {
          // Strip 'Key: ' prefix and convert to uppercase
          this.keyMap[led.name.replace('Key: ', '').toLowerCase()] = index;
        });
        this.colors = Array<Color>(keyboard.colors.length).fill({ red: 0, green: 0, blue: 0 });
        this.client.updateLeds(rgb.deviceId, this.colors);
        this.logger.debug('Setting colors...');
      } else {
        throw Error('No keyboard found!');
      }
    } catch (error) {
      this.logger.error(`Unable to init keyboard because of ${error?.message ?? error}`);
    } finally {
      this.logger.debug('Disconnecting from openrgb server');
      try {
        this.client.disconnect();
      } catch (error) {
        this.logger.error('Error disconnecting:', error);
      }
    }
  }
}
