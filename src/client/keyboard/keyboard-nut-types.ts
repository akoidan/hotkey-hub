import {
  Key,
  keyboard
} from '@nut-tree-fork/nut-js';
import { z } from 'zod';
// @ts-expect-error
import KeyboardAction from "@nut-tree-fork/libnut/dist/lib/libnut-keyboard.class.js";


export const possibleKeys: string[] = [...KeyboardAction.KeyLookupMap.values()]
export const invertedMap: Map<string, Key> = new Map([...KeyboardAction.KeyLookupMap].map(([key, value]) => [value, key]));


