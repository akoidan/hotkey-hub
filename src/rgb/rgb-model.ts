import type {RgbColor} from '@/native/native-model';

interface RgbServiceI {
  updateColor(comb: string, state: KeyState): void;
  setup(): Promise<boolean>;
}

interface LedState {
  ledIndex: number;
  color: RgbColor;
}

enum ConnectionState {
  INITING = 'INITING',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  NOT_AVAILABLE = 'NOT_AVAILABLE',
}

enum KeyState {
  ON = 'ON',
  OFF = 'OFF',
  ERROR = 'ERROR',
}

export type {
  RgbServiceI,
  LedState,
};

export {ConnectionState, KeyState};