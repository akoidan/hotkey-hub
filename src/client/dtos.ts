import type {Key} from '@/config/types/commands';

interface MouseClickRequest {
  x: number;
  y: number;
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
  FindProcessWindowsResponse,
};
