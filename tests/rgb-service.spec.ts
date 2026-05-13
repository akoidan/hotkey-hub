import {Test} from '@nestjs/testing';
import {Logger} from '@nestjs/common';
import {RgbService} from '../src/rgb/rgb-service';
import {ConfigService} from '../src/config/config-service';
import {KeyState} from '../src/rgb/rgb-model';
import {Native, OpenRgbNativeModule} from '../src/native/native-model';
import {RgbData} from '@/config/types/rgb';

const DEVICE_NAME = 'TestKeyboard';



async function getService(rgbConfig: Partial<RgbData>) {
  const configService: {getOpenRgb: () => RgbData} = {getOpenRgb: jest.fn().mockReturnValue({
      deviceName: DEVICE_NAME,
      serverAddr: 'localhost',
      serverPort: 6742,
      clientName: 'test',
      keyMapFn: undefined,
      offLed: '#000000',
      onLed: '#00FF00',
      errorLed: '#FF0000',
      ...rgbConfig,
  })};

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

  it('should convert hex color with # prefix for ON state', async () => {
    const {service, native} = await getService({
      onLed: '#00FF80',
    } as any);
    service.updateColor('Alt+A', KeyState.ON);
    expect(native.rgbUpdateSingleLed).toHaveBeenCalledWith(0, 0, {red: 0, green: 255, blue: 128});
  });

  it('should convert hex color without # prefix for ERROR state', async () => {
    const {service, native} = await getService({
      errorLed: '#FF4400',
    } as any);
    service.updateColor('Alt+A', KeyState.ERROR);
    expect(native.rgbUpdateSingleLed).toHaveBeenCalledWith(0, 0, {red: 255, green: 68, blue: 0});
  });

  it('should call rgbUpdateSingleLed with OFF color', async () => {
    const {service, native} = await getService({
      offLed: '#050A0F',
    });
    service.updateColor('Alt+A', KeyState.OFF);
    expect(native.rgbUpdateSingleLed).toHaveBeenCalledWith(0, 0, {red: 5, green: 10, blue: 15});
  });
});