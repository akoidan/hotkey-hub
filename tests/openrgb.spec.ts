import {OpenRgbNativeModule} from '../src/native/native-model';

const DEVICE_NAME = 'HyperX Alloy Origins Core (HP)';

describe.skip('RgbService integration', () => {
  let service: OpenRgbNativeModule;

  beforeAll(async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports,@typescript-eslint/no-unsafe-call
    service = require('bindings')('native') as OpenRgbNativeModule;
    await service.rgbConnect('localhost', 6742, 'l2');
  });

  afterAll(() => {
    service.rgbDisconnect();
  });

  it('should update a single LED', async () => {
    const devices = await service.rgbGetDevices();
    const dev = devices.find(e => e.name === DEVICE_NAME)!;
    expect(dev).toBeDefined();
    service.rgbSetCustomMode(dev.deviceId);
    service.rgbUpdateSingleLed(dev.deviceId, 0, {red: 255, green: 0, blue: 0})
    await new Promise(r => setTimeout(r, 300));
    const off = Array<{red: number; green: number; blue: number}>(dev.leds.length).fill({red: 0, green: 0, blue: 0});
    service.rgbUpdateAllLeds(dev.deviceId, off);
    await new Promise(r => setTimeout(r, 300));
    service.rgbUpdateSingleLed(dev.deviceId, 0, {red: 0, green: 255, blue: 0})
    await new Promise(r => setTimeout(r, 300));
    service.rgbDisconnect()
  }, 15000);
});
