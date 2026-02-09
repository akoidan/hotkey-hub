import {
  BadRequestException,
  Body,
  Controller,
  DynamicModule,
  Injectable,
  Logger,
  Module,
  OnModuleInit,
  Post
} from '@nestjs/common';
import {ConfigModule} from '@/config/config-module';
import {ClientModule} from '@/client/client-module';
import {LocalModule} from '@/local/local.module';
import {KeybindingService} from '@/local/keybinding-service';
import clc from 'cli-color';
import {ConfigService} from '@/config/config-service';
import {CERT_DIR} from '@/client/client-model';
import {CONFIG_FILE, VARIABLES_FILE} from '@/config/config-model';
import {AppConfig, ReloadRequest} from '@/app/app-model';
import {AppService} from "@/app/app.service";


@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly logger: Logger,
  ) {
  }

  @Post('reload')
  async getMonitors(@Body() body: ReloadRequest): Promise<void>  {
    if (!body) {
      throw new BadRequestException();
    }
    if (!body.configFile && !body.variablesFile) {
      throw new BadRequestException('At least one of configFile or variablesFile must be provided');
    }
    if (body.configFile && typeof body.configFile !== 'string') {
      throw new BadRequestException('configFile should be string');
    }
    if (body.variablesFile && typeof body.variablesFile !== 'string') {
      throw new BadRequestException('variablesFile should be string');
    }
    try {
      await this.appService.reload(body);
    } catch (error) {
      this.logger.error(error, error.stack);
      throw new BadRequestException(error.message);
    }
  }
}
