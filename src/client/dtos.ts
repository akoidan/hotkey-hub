/**
 * Ping status
 */
interface PingResponseDto {
  status: string;
  version: string;
}

/**
 * Duration of key beeing presssed
 */
interface KeyPressRequestDto {
  keys: string[];
  duration?: number;
  holdKeys?: string[];
}

/**
 * A delay between keystrokes in milliseconds. By default type as fast as possible
 */
interface TypeTextRequestDto {
  text: string;
  keyDelay?: number;
  keyDelayDeviation?: number;
}

/**
 * Keyboard layout
 */
interface SetKeyboardLayoutRequestDto {
  layout: string;
}

/**
 * X coordinate to move mouse to
 */
interface MousePositionRRDto {
  x: number;
  y: number;
}

interface FunctionDto {

}

/**
 * Mouse button, left=1, right=2 , middle=3
 */
interface MouseClickRequestDto {
  button?: string;
}

/**
 * Rectangle bounds for a window
 */
interface GetWindowResponseDto {
  bounds: object;
  wid: number;
  pid: number;
  path: string;
  parentWid: number;
  opacity: number;
  title: string;
}

/**
 * Rectangle bounds for a window
 */
interface SetWindowPropertiesRequestDto {
  bounds?: object;
  state?: string;
  opacity?: number;
}

/**
 * Full monitor bounds
 */
interface MonitorInfoResponseDto {
  bounds: object;
  workArea: object;
  scale: number;
  isPrimary: boolean;
}

/**
 * Path to executable
 */
interface LaunchExeRequestDto {
  path: string;
  arguments: string[];
  waitTillFinish: boolean;
}

/**
 * Process ID
 */
interface ProcessResponseDto {
  pid: number;
  parentPid: number;
  path: string;
  isElevated: boolean;
  threadCount: number;
  memory: object;
  times: object;
  wids: number[];
}

export type {
  PingResponseDto,
  KeyPressRequestDto,
  TypeTextRequestDto,
  SetKeyboardLayoutRequestDto,
  MousePositionRRDto,
  FunctionDto,
  MouseClickRequestDto,
  GetWindowResponseDto,
  SetWindowPropertiesRequestDto,
  MonitorInfoResponseDto,
  LaunchExeRequestDto,
  ProcessResponseDto,
};
