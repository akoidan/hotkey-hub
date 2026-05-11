import {Test} from '@nestjs/testing';
import {Logger} from '@nestjs/common';
import {RgbService} from '../src/rgb/rgb-service';
import {ConfigService} from '../src/config/config-service';
import {KeyState} from '../src/rgb/rgb-model';
import {Native, OpenRgbNativeModule} from '../src/native/native-model';

const DEVICE_NAME = 'TestKeyboard';

const baseConfig = {
  deviceName: DEVICE_NAME,
  serverAddr: 'localhost',
  serverPort: 6742,
  clientName: 'test',
  keyMapFn: undefined,
  offLed: {red: 0, green: 0, blue: 0},
  onLed: {red: 0, green: 255, blue: 0},
  errorLed: {red: 255, green: 0, blue: 0},
};

async function getService(rgbConfig: typeof baseConfig) {
  const configService = {getOpenRgb: jest.fn().mockReturnValue(rgbConfig)} as unknown as ConfigService;
  const native: jest.Mocked<OpenRgbNativeModule> = {
    rgbConnect: jest.fn().mockResolvedValue(undefined),
    rgbGetDevices: jest.fn().mockResolvedValue([{
      deviceId: 0,
      name: DEVICE_NAME,
      leds: [{name: 'a'}], // lowercase so encodeKey matches updateColor's key extraction
      colorCount: 1,
    }]),
    rgbRegisterDCEvent: jest.fn(),
    rgbSetCustomMode: jest.fn(),
    rgbUpdateAllLeds: jest.fn(),
    rgbUpdateSingleLed: jest.fn(),
    rgbDisconnect: jest.fn(),
  } as any;

  const module = await Test.createTestingModule({
    providers: [
      RgbService,
      {provide: ConfigService, useValue: configService},
      {provide: Native, useValue: native},
      Logger,
    ],
  }).compile();

  const service = module.get<RgbService>(RgbService);
  await service.setup();
  return {service, native};
}

describe('RgbService', () => {
  it('should call rgbUpdateSingleLed with RGB object color for ON state', async () => {
    const {service, native} = await getService({
      ...baseConfig,
      onLed: {red: 10, green: 20, blue: 30},
    });
    service.updateColor('Alt+A', KeyState.ON);
    expect(native.rgbUpdateSingleLed).toHaveBeenCalledWith(0, 0, {red: 10, green: 20, blue: 30});
  });

  it('should convert hex color with # prefix for ON state', async () => {
    const {service, native} = await getService({
      ...baseConfig,
      onLed: '#00FF80',
    } as any);
    service.updateColor('Alt+A', KeyState.ON);
    expect(native.rgbUpdateSingleLed).toHaveBeenCalledWith(0, 0, {red: 0, green: 255, blue: 128});
  });

  it('should convert hex color without # prefix for ERROR state', async () => {
    const {service, native} = await getService({
      ...baseConfig,
      errorLed: 'FF4400',
    } as any);
    service.updateColor('Alt+A', KeyState.ERROR);
    expect(native.rgbUpdateSingleLed).toHaveBeenCalledWith(0, 0, {red: 255, green: 68, blue: 0});
  });

  it('should call rgbUpdateSingleLed with OFF color', async () => {
    const {service, native} = await getService({
      ...baseConfig,
      offLed: {red: 5, green: 10, blue: 15},
    });
    service.updateColor('Alt+A', KeyState.OFF);
    expect(native.rgbUpdateSingleLed).toHaveBeenCalledWith(0, 0, {red: 5, green: 10, blue: 15});
  });
});