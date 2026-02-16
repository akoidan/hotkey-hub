import {BadRequestException, Body, Controller, Logger, Post} from '@nestjs/common';
import {ReloadRequest} from '@/app/app-model';
import {StartService} from '@/app/start.service';


@Controller()
export class AppController {
  constructor(
    private readonly appService: StartService,
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
