import {Injectable, Logger} from '@nestjs/common';

import {VariableResolutionService} from '@/local/variable-resolution.service';
import {BaseLocalHandler} from '@/local/base-local-handler';
import {GetInfoRemoteCommand} from '@/config/types/get-commands/get-commands';
import {GetInfoHandler} from '@/get-info/get-info-handler';
import {ConfigService} from '@/config/config-service';

@Injectable()
export class GetLocalHandler extends BaseLocalHandler {
  constructor(
    private readonly variableService: VariableResolutionService,
    private readonly configService: ConfigService,
    private readonly logger: Logger,
    private readonly getInfoHandler: GetInfoHandler,
  ) {
    super();
  }

  canHandle(command: GetInfoRemoteCommand): command is GetInfoRemoteCommand {
    return Boolean(command.get);
  }

  public async* execute(input: GetInfoRemoteCommand): AsyncGenerator<void> {
    // ignore delays for Get commands, as they should not block/conflicts other commands like typeText
    const currRec: GetInfoRemoteCommand = this.variableService.replaceVariables(input);
    this.logger.debug(`Running ${JSON.stringify(currRec)}`);
    const res = await this.getInfoHandler.handle(currRec.destination as string, currRec);
    if (Array.isArray(currRec.assignVariable)) {
      if (!Array.isArray(res)) {
        throw Error(`Unable to map  """${JSON.stringify(res)}"""` +
          `into variables ${JSON.stringify(currRec.assignVariable)}, since response is not an array`);
      }
      if (res.length !== currRec.assignVariable.length) {
        throw Error(`Unable to map  """${JSON.stringify(res)}"""` +
          `into variables ${JSON.stringify(currRec.assignVariable)}, since different length`);
      }
      for (let i = 0; i < currRec.assignVariable.length; i ++) {
        this.configService.setVariable(currRec.assignVariable[i], res[i]);
      }
    } else {
      this.configService.setVariable(currRec.assignVariable, res);
    }
    yield undefined;
  }
}
