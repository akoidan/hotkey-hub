import type {Key} from '@/config/types/remote/keyboard-commands-schema';

interface PingResponseDto {
  status: string;
  version: string;
}

interface MouseClickRequest {
  x: number;
  y: number;
}

interface MouseMoveHumanRequest {
  x: number;
  y: number;
  destinationRandomX?: number;
  destinationRandomY?: number;
  delayBetweenIterations?: number;
  pixelsPerIteration?: number;
  curveIntensity?: number;
  curveIntensityDeviation?: number;
}

interface SendKeyRequest {
  keys: Key[];
  holdKeys: Key[];
  duration?: number;
}

interface FocusExeRequest {
  pid: number;
}

interface LaunchExeRequest {
  path: string;
  arguments: string[];
  waitTillFinish: boolean;
}

interface GetActiveWindowInfoResponse {
  path: string;
  wid: number;
  pid: number
}

interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SetWindowBoundsRequest {
  wid: number;
  bounds: WindowBounds;
}

interface KillExeByNameRequest {
  name: string;
}

interface FindPidsByNameRequest {
  name: string;
}


interface FocusWindowRequest {
  wid: number;
}

interface MonitorBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface MonitorInfo {
  bounds: MonitorBounds;
  workArea: MonitorBounds;
  isPrimary: boolean
}

interface KillExeByPidRequest {
  pid: number;
}

interface TypeTextRequest {
  text: string;
  keyDelayDeviation?: number;
  keyDelay?: number;
}

interface LaunchPidResponse {
  pid: number;
}

interface WindowTitleResponseDto {
  title: string;
}

interface WindowOpacityResponseDto {
  opacity: number;
}

interface WindowOwnerResponseDto {
  wid: number;
}

interface IsWindowResponseDto {
  isValid: boolean;
}

interface IsWindowVisibleResponseDto {
  isVisible: boolean;
}

interface ActiveWindowIdResponseDto {
  wid: number;
}

interface MonitorScaleFactorResponseDto {
  scaleFactor: number;
}

interface MonitorIdResponseDto {
  mid: number;
}

interface WindowHandleResponseDto {
  wid: number;
}

export type {
  MonitorBounds,
  MonitorInfo,
  MouseClickRequest,
  SendKeyRequest,
  FocusExeRequest,
  LaunchPidResponse,
  LaunchExeRequest,
  TypeTextRequest,
  FindPidsByNameRequest,
  KillExeByNameRequest,
  KillExeByPidRequest,
  GetActiveWindowInfoResponse,
  FocusWindowRequest,
  SetWindowBoundsRequest,
  WindowBounds,
  MouseMoveHumanRequest,
  PingResponseDto,
  WindowTitleResponseDto,
  WindowOpacityResponseDto,
  WindowOwnerResponseDto,
  IsWindowResponseDto,
  IsWindowVisibleResponseDto,
  ActiveWindowIdResponseDto,
  MonitorScaleFactorResponseDto,
  MonitorIdResponseDto,
  WindowHandleResponseDto,
};
