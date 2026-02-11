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

/**
 * Maximum random offset in pixels from the target X coordinate. Adds natural imprecision to final position.
 */
interface MouseMoveHumanRequestDto {
  destinationRandomX?: number;
  destinationRandomY?: number;
  delayBetweenIterations?: number;
  pixelsPerIteration?: number;
  curveIntensity?: number;
  curveIntensityDeviation?: number;
  x: number;
  y: number;
}

/**
 * Mouse button, left=1, right=2 , middle=3
 */
interface MouseClickRequestDto {
  button?: string;
}

/**
 * Left position in screen coordinates (pixels)
 */
interface Generated1Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Rectangle bounds for a window
 */
interface GetWindowResponseDto {
  bounds: Generated1Bounds;
  wid: number;
  pid: number;
  path: string;
  parentWid: number;
  opacity: number;
  title: string;
}

/**
 * Left position in screen coordinates (pixels)
 */
interface Generated2Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Rectangle bounds for a window
 */
interface SetWindowPropertiesRequestDto {
  bounds?: Generated2Bounds;
  state?: string;
  opacity?: number;
}

/**
 * Left position in screen coordinates (pixels)
 */
interface Generated3Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Left position in screen coordinates (pixels)
 */
interface Generated4Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Full monitor bounds
 */
interface MonitorInfoResponseDto {
  bounds: Generated3Bounds;
  workArea: Generated4Bounds;
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
 * Current amount of memory used by the process in Bytes. This is actual memory currently resident in RAM that belongs to this process
 */
interface Generated5Bounds {
  workingSetSize: number;
  peakWorkingSetSize: number;
  privateUsage: number;
  pageFileUsage: number;
}

/**
 * 100-nanoseconds since 1601-01-01 (Windows FILETIME format)
 */
interface Generated6Bounds {
  creationTime: number;
  kernelTime: number;
  userTime: number;
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
  memory: Generated5Bounds;
  times: Generated6Bounds;
  wids: number[];
}

export type {
  PingResponseDto,
  KeyPressRequestDto,
  TypeTextRequestDto,
  SetKeyboardLayoutRequestDto,
  MousePositionRRDto,
  MouseMoveHumanRequestDto,
  MouseClickRequestDto,
  Generated1Bounds,
  GetWindowResponseDto,
  Generated2Bounds,
  SetWindowPropertiesRequestDto,
  Generated3Bounds,
  Generated4Bounds,
  MonitorInfoResponseDto,
  LaunchExeRequestDto,
  Generated5Bounds,
  Generated6Bounds,
  ProcessResponseDto,
};
