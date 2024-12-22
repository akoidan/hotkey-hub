import {
  IsArray,
  IsBoolean,
  IsDefined,
  IsIP,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
  ValidateIf
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

// Schema for Aliases
class Aliases {
  @IsArray()
  @IsString({ each: true })
  aliases: string[];
}

// Simple Receiver Schema
class ReceiverSimple {
  @IsString()
  destination: string;

  @IsString()
  keySend: string;

  @IsOptional()
  @IsNumber()
  delay?: number;
}

// ID Receiver Schema
class ReceiverId {
  @IsString()
  destination: string;

  @IsString()
  id: string;

  @IsOptional()
  @IsNumber()
  delay?: number;

  @IsDefined()
  run: any;
}

export type Receiver = ReceiverSimple | ReceiverId;

// Combination Receiver Schema
class ConfigCombination {
  @ValidateNested({ each: true })
  @Type(() => ReceiverSimple || ReceiverId)
  @IsArray()
  receivers: Receiver[];

  @IsOptional()
  @IsBoolean()
  shuffle?: boolean;

  @IsOptional()
  @IsNumber()
  delay?: number;

  @IsString()
  name: string;

  @IsString()
  shortCut: string;

  @IsOptional()
  @IsBoolean()
  circular?: boolean;
}

// IP validation class
export class IpValue {
  @IsIP(4)
  value!: string;
}

// Transform decorator for IPs
export function TransformToIpRecord() {
  return Transform(({ value }) => {
    if (typeof value !== 'object') return value;
    const result: Record<string, IpValue> = {};
    for (const [key, ip] of Object.entries(value)) {
      result[key] = { value: ip };
    }
    return result;
  });
}

// Full Configuration Schema
class ConfigData {
  @IsObject()
  @ValidateNested()
  @TransformToIpRecord()
  @Type(() => IpValue)
  ips!: Record<string, IpValue>;

  @IsObject()
  @ValidateNested()
  @Type(() => Aliases)
  aliases: Record<string, string[]>;

  @IsNumber()
  delay: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConfigCombination)
  combinations: ConfigCombination[];

  // Custom validation logic
  validate() {
    const ipsKeys = new Set(Object.keys(this.ips));
    const aliasesKeys = new Set(Object.keys(this.aliases));

    // Validate aliases
    Object.entries(this.aliases).forEach(([key, values]) => {
      values.forEach((value) => {
        if (!ipsKeys.has(value)) {
          throw new Error(`Alias '${value}' is not a valid key from ips. Valid keys: ${JSON.stringify([...ipsKeys])}`);
        }
      });
    });

    // Validate combinations
    this.combinations.forEach((combination) => {
      combination.receivers.forEach((receiver) => {
        if (!aliasesKeys.has(receiver.destination)) {
          throw new Error(`Destination '${receiver.destination}' is not a valid key from aliases. Valid keys: ${JSON.stringify([...aliasesKeys])}`);
        }
      });
    });
  }
}

export {
  Aliases,
  ReceiverSimple,
  ReceiverId,
  ConfigCombination,
  ConfigData,
  IpValue,
};
