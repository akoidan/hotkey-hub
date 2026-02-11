/* eslint-disable max-lines, max-len */
/** 
 * This code was generated via yarn openapi-client
 * Do not edit it manually
 */


/**
 * Ping status
 */
interface PingResponseDto {
  status: 'ok';
  version: string;
}

/**
 * Duration of key beeing presssed
 */
interface KeyPressRequestDto {
  keys: 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j' | 'k' | 'l' | 'm' | 'n' | 'o' | 'p' | 'q' | 'r' | 's' | 't' | 'u' | 'v' | 'w' | 'x' | 'y' | 'z' | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'f1' | 'f2' | 'f3' | 'f4' | 'f5' | 'f6' | 'f7' | 'f8' | 'f9' | 'f10' | 'f11' | 'f12' | 'f13' | 'f14' | 'f15' | 'f16' | 'f17' | 'f18' | 'f19' | 'f20' | 'f21' | 'f22' | 'f23' | 'f24' | 'backspace' | 'delete' | 'return' | 'enter' | 'tab' | 'escape' | 'space' | 'insert' | 'print_screen' | 'home' | 'end' | 'page_up' | 'page_down' | 'up' | 'down' | 'left' | 'right' | 'caps_lock' | 'num_lock' | 'scroll_lock' | 'add' | 'subtract' | 'multiply' | 'divide' | 'clear' | 'numpad_0' | 'numpad_1' | 'numpad_2' | 'numpad_3' | 'numpad_4' | 'numpad_5' | 'numpad_6' | 'numpad_7' | 'numpad_8' | 'numpad_9' | 'numpad_decimal' | ',' | '.' | '/' | ';' | '\'' | '[' | ']' | '\\' | '-' | '=' | '`' | 'audio_mute' | 'audio_vol_down' | 'audio_vol_up' | 'audio_play' | 'audio_stop' | 'audio_pause' | 'audio_prev' | 'audio_next' | 'audio_rewind' | 'audio_forward' | 'audio_repeat' | 'audio_random' | 'lights_mon_up' | 'lights_mon_down' | 'lights_kbd_toggle' | 'lights_kbd_up' | 'lights_kbd_down' | 'menu' | 'pause' | 'control' | 'right_control' | 'alt' | 'right_alt' | 'shift' | 'right_shift' | 'meta' | 'right_meta' | 'win' | 'right_win' | 'cmd' | 'right_cmd' | 'fn'[];
  duration?: number;
  holdKeys?: 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j' | 'k' | 'l' | 'm' | 'n' | 'o' | 'p' | 'q' | 'r' | 's' | 't' | 'u' | 'v' | 'w' | 'x' | 'y' | 'z' | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'f1' | 'f2' | 'f3' | 'f4' | 'f5' | 'f6' | 'f7' | 'f8' | 'f9' | 'f10' | 'f11' | 'f12' | 'f13' | 'f14' | 'f15' | 'f16' | 'f17' | 'f18' | 'f19' | 'f20' | 'f21' | 'f22' | 'f23' | 'f24' | 'backspace' | 'delete' | 'return' | 'enter' | 'tab' | 'escape' | 'space' | 'insert' | 'print_screen' | 'home' | 'end' | 'page_up' | 'page_down' | 'up' | 'down' | 'left' | 'right' | 'caps_lock' | 'num_lock' | 'scroll_lock' | 'add' | 'subtract' | 'multiply' | 'divide' | 'clear' | 'numpad_0' | 'numpad_1' | 'numpad_2' | 'numpad_3' | 'numpad_4' | 'numpad_5' | 'numpad_6' | 'numpad_7' | 'numpad_8' | 'numpad_9' | 'numpad_decimal' | ',' | '.' | '/' | ';' | '\'' | '[' | ']' | '\\' | '-' | '=' | '`' | 'audio_mute' | 'audio_vol_down' | 'audio_vol_up' | 'audio_play' | 'audio_stop' | 'audio_pause' | 'audio_prev' | 'audio_next' | 'audio_rewind' | 'audio_forward' | 'audio_repeat' | 'audio_random' | 'lights_mon_up' | 'lights_mon_down' | 'lights_kbd_toggle' | 'lights_kbd_up' | 'lights_kbd_down' | 'menu' | 'pause' | 'control' | 'right_control' | 'alt' | 'right_alt' | 'shift' | 'right_shift' | 'meta' | 'right_meta' | 'win' | 'right_win' | 'cmd' | 'right_cmd' | 'fn'[];
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
  layout: 'us' | 'en' | 'gb' | 'au' | 'nz' | 'ie' | 'za' | 'de' | 'at' | 'ch' | 'li' | 'fr' | 'be' | 'lu' | 'mc' | 'es' | 'mx' | 'cl' | 've' | 'pe' | 'ec' | 'uy' | 'py' | 'bo' | 'it' | 'sm' | 'va' | 'pt' | 'nl' | 'sr' | 'no' | 'dk' | 'fi' | 'is' | 'pl' | 'cz' | 'sk' | 'hu' | 'hr' | 'ba' | 'rs' | 'me' | 'mk' | 'bg' | 'ro' | 'md' | 'ee' | 'lv' | 'lt' | 'mt' | 'tr' | 'az' | 'ru' | 'by' | 'ua' | 'kz' | 'kg' | 'tj' | 'uz' | 'tm' | 'mn' | 'gr' | 'ar' | 'ae' | 'bh' | 'dz' | 'eg' | 'iq' | 'jo' | 'kw' | 'ly' | 'ma' | 'om' | 'qa' | 'sa' | 'sy' | 'tn' | 'ye' | 'fa' | 'ir' | 'ur' | 'pk' | 'il' | 'he' | 'cn' | 'zh' | 'tw' | 'hk' | 'mo' | 'jp' | 'ja' | 'kr' | 'ko' | 'th' | 'vn' | 'vi' | 'kh' | 'km' | 'lo' | 'my' | 'ms' | 'id' | 'ph' | 'tl' | 'sg' | 'bn' | 'bd' | 'hi' | 'in' | 'ta' | 'te' | 'ml' | 'kn' | 'gu' | 'or' | 'pa' | 'as' | 'ne' | 'si' | 'lk' | 'mm' | 'am' | 'et' | 'sw' | 'ke' | 'tz' | 'zu' | 'xh' | 'af' | 'ha' | 'ng' | 'sn' | 'bf' | 'ci' | 'gn' | 'td' | 'cf' | 'cm' | 'cg' | 'cd' | 'mg' | 'dj' | 'eo' | 'la' | 'eu' | 'ca' | 'gl' | 'cy' | 'ga' | 'gd' | 'br' | 'oc' | 'co' | 'sc' | 'fur' | 'rm' | 'lb' | 'fo' | 'kl' | 'se' | 'smj' | 'sma' | 'smn' | 'sms';
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
  button?: 'LEFT' | 'RIGHT' | 'MIDDLE';
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
  pid?: number;
  path?: string;
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
  state?: 'show' | 'hide' | 'minimize' | 'restore' | 'maximize';
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

/**
 * Path to executable
 */
interface LaunchExeRequestDto {
  path: string;
  arguments: string[];
  waitTillFinish: boolean;
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
  Generated5Bounds,
  Generated6Bounds,
  ProcessResponseDto,
  LaunchExeRequestDto,
};
