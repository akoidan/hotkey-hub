import { possibleKeys } from '@/client/keyboard/keyboard-nut-types';
import {
  IsIn,
  IsString
} from 'class-validator';

export class SendEvent {
  @IsIn(possibleKeys)
  @IsString()
  key: string;
}
