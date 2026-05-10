import type {RgbColor} from '@/native/native-model';

interface RgbServiceI {
  updateColor(comb: string, color: RgbColor): void;
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

export type {
  RgbServiceI,
  LedState,
};

export {ConnectionState};