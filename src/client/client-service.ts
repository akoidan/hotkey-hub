import {Injectable} from '@nestjs/common';
import {AppService} from '@/client/services/app.service';
import {KeyboardService} from '@/client/services/keyboard.service';
import {MonitorService} from '@/client/services/monitor.service';
import {ProcessService} from '@/client/services/process.service';
import {WindowService} from '@/client/services/window.service';
import {MouseService} from '@/client/services/mouse.service';


@Injectable()
export class ClientService {
  constructor(
    public readonly app: AppService,
    public readonly keyboard: KeyboardService,
    public readonly monitor: MonitorService,
    public readonly mouse: MouseService,
    public readonly process: ProcessService,
    public readonly window: WindowService,
  ) {
  }
}
