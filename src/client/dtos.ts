import type {Key} from '@/config/types/remote-commands';

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

interface FindPidsByNameResponse {
  pids: string;
}

interface FindProcessWindowsResponse {
  wids: string;
}

interface FocusWindowRequest {
  wid: number;
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

export type {
  MouseClickRequest,
  SendKeyRequest,
  FocusExeRequest,
  LaunchPidResponse,
  LaunchExeRequest,
  TypeTextRequest,
  FindPidsByNameRequest,
  KillExeByNameRequest,
  KillExeByPidRequest,
  FocusWindowRequest,
  FindPidsByNameResponse,
  SetWindowBoundsRequest,
  WindowBounds,
  FindProcessWindowsResponse,
  MouseMoveHumanRequest,
};
