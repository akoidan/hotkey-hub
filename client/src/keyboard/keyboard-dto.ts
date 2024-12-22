import { possibleKeys } from './keyboard-nut-types';
import {
  IsIn,
  IsString
} from 'class-validator';

export class SendEvent {
  @IsIn(possibleKeys)
  @IsString()
  key: string;
}
