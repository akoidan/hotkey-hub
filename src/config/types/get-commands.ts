import {z} from 'zod';
import {variableValueSchema} from '@/config/types/variables';

enum GetRequest {
  findPidsByName = 'findPidsByName',
  findProcessWindows = 'findProcessWindows',
  findProcessesWindows = 'findProcessesWindows',


  mousePosition = 'mousePosition',
  processWindows = 'processWindows',
  activeWindow = 'activeWindow',
  activeWindowId = 'activeWindowId',
  windowBounds = 'windowBounds',
  windowTitle = 'windowBounds',
  windowOpacity = 'windowBounds',
  windowOwner = 'windowBounds',
  isWindow = 'windowBounds',
  isWindowVisible = 'windowBounds',

  monitor = 'windowBounds',
  monitorInfo = 'windowBounds',

  mainWindow
}

const getRequestEnumSchema = z.nativeEnum(GetRequest)
  .describe('Random = shuffle array so it takes next element randomly.' +
    ' Reverse = each time it changes the order from first to last, then from last to first.' +
    ' Straight = Default order from first to last');

const executeGetReqeustRemoteCommandSchema = z.object({
  get: getRequestEnumSchema,
  assignVariable: z.string().describe('Name of the variable to store the response of result. ' +
    'This variable can be referenced in subsequent commands using {{variableName}} syntax.'),
})
  .strict()
  .describe('Allows to execute getRequest on remote schema, check http-remote-control swagger.json file for get request and their reponses');