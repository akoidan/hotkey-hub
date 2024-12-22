import { Key } from '@nut-tree-fork/nut-js';
import { IsEnum } from 'class-validator';

export class SendEvent {
  @IsEnum(Key)
  key: Key;
}


