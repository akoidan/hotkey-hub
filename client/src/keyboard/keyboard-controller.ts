import {
  Body,
  Controller,
  Get,
  Post
} from '@nestjs/common';
import { KeyboardService } from './keyboard-service';
import { SendEvent } from './keyboard-dto';

@Controller()
export class KeyboardController {
  constructor(private readonly keyboardService: KeyboardService) {}

 @Get('ping')
  async ping(): Promise<string> {
    return "pong"
  }

  @Post('send-event')
  async sendEvent(@Body() body: SendEvent): Promise<void> {
    await this.keyboardService.sendKey(body.key);
  }
}
