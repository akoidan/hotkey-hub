import { Test } from '@nestjs/testing';
import { ShortcutProcessingService } from '@/logic/shortcut-processing.service';
import { ClientService } from '@/client/client-service';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@/config/config-service';
import { VariableResolutionService } from '@/logic/variable-resolution.service';
import { CommandProcessingService } from '@/logic/command-processing.service';
import { CircularIndex } from '@/logic/circular-index';
import { CommandHandler } from '@/handlers/command-handler.service';

describe('shortcut-combinations', () => {
  it('should process mouse click commands', async () => {
    const mockClientService = {
      leftMouseClick: jest.fn().mockResolvedValue(undefined),
      keyPress: jest.fn().mockResolvedValue(undefined),
      launchExe: jest.fn().mockResolvedValue({ pid: 123 }),
      killExeByPid: jest.fn().mockResolvedValue(undefined),
      killExeByName: jest.fn().mockResolvedValue(undefined),
      focusWindow: jest.fn().mockResolvedValue(undefined),
      typeText: jest.fn().mockResolvedValue(undefined),
    };

    const mockCommandHandler = {
      handle: jest.fn().mockImplementation(async (destination, command) => {
        if (command.leftMouseClick) {
          await mockClientService.leftMouseClick(destination);
        }
      }),
    };

    const mockConfigService = {
      getIps: jest.fn().mockReturnValue({
        'this': '127.0.0.1',
        'desktop': '192.168.100.9'
      }),
      getGlobalVars: jest.fn().mockReturnValue({}),
      getVariables: jest.fn().mockReturnValue({}),
      getAliases: jest.fn().mockReturnValue({}),
      getDelayBefore: jest.fn().mockReturnValue(0),
      getDelayAfter: jest.fn().mockReturnValue(0),
      parseConfig: jest.fn(),
    };

    const testModule = await Test.createTestingModule({
      providers: [
        ShortcutProcessingService,
        VariableResolutionService,
        CommandProcessingService,
        CircularIndex,
        {
          provide: CommandHandler,
          useValue: mockCommandHandler,
        },
        {
          provide: ClientService,
          useValue: mockClientService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        Logger,
      ],
    }).compile();

    const shortCutService = testModule.get<ShortcutProcessingService>(ShortcutProcessingService);
    const clientService = testModule.get<ClientService>(ClientService);
    
    const spyLeftMouseClick = jest.spyOn(clientService, 'leftMouseClick');

    await shortCutService.processUnknownShortCut({
      commands: [
        {
          destination: 'desktop',
          leftMouseClick: true,
        },
        {
          destination: 'desktop',
          leftMouseClick: true,
        },
      ],
      name: 'Mouse Click Test',
      shortCut: 'Alt+1',
    });

    expect(spyLeftMouseClick).toHaveBeenCalledTimes(2);
    expect(spyLeftMouseClick).toHaveBeenCalledWith('desktop');
  });

  it('should process launch commands with arguments', async () => {
    const mockClientService = {
      leftMouseClick: jest.fn().mockResolvedValue(undefined),
      keyPress: jest.fn().mockResolvedValue(undefined),
      launchExe: jest.fn().mockResolvedValue({ pid: 123 }),
      killExeByPid: jest.fn().mockResolvedValue(undefined),
      killExeByName: jest.fn().mockResolvedValue(undefined),
      focusWindow: jest.fn().mockResolvedValue(undefined),
      typeText: jest.fn().mockResolvedValue(undefined),
    };

    const mockCommandHandler = {
      handle: jest.fn().mockImplementation(async (destination, command) => {
        if (command.launch) {
          await mockClientService.launchExe(destination, command.launch, command.arguments);
        }
      }),
    };

    const mockConfigService = {
      getIps: jest.fn().mockReturnValue({
        'this': '127.0.0.1',
        'desktop': '192.168.100.9'
      }),
      getGlobalVars: jest.fn().mockReturnValue({}),
      getVariables: jest.fn().mockReturnValue({}),
      getAliases: jest.fn().mockReturnValue({}),
      getDelayBefore: jest.fn().mockReturnValue(0),
      getDelayAfter: jest.fn().mockReturnValue(0),
      parseConfig: jest.fn(),
    };

    const testModule = await Test.createTestingModule({
      providers: [
        ShortcutProcessingService,
        VariableResolutionService,
        CommandProcessingService,
        CircularIndex,
        {
          provide: CommandHandler,
          useValue: mockCommandHandler,
        },
        {
          provide: ClientService,
          useValue: mockClientService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        Logger,
      ],
    }).compile();

    const shortCutService = testModule.get<ShortcutProcessingService>(ShortcutProcessingService);
    const clientService = testModule.get<ClientService>(ClientService);
    
    const spyLaunchExe = jest.spyOn(clientService, 'launchExe');

    await shortCutService.processUnknownShortCut({
      commands: [
        {
          destination: 'desktop',
          launch: 'C:\\Windows\\System32\\shutdown.exe',
          arguments: ['/s', '/t', '0'],
        },
      ],
      name: 'Shutdown Test',
      shortCut: 'Alt+F11',
    });

    expect(spyLaunchExe).toHaveBeenCalledWith('desktop', 'C:\\Windows\\System32\\shutdown.exe', ['/s', '/t', '0']);
  });

  it('should process macro with variables', async () => {
    const mockClientService = {
      leftMouseClick: jest.fn().mockResolvedValue(undefined),
      keyPress: jest.fn().mockResolvedValue(undefined),
      launchExe: jest.fn().mockResolvedValue({ pid: 123 }),
      killExeByPid: jest.fn().mockResolvedValue(undefined),
      killExeByName: jest.fn().mockResolvedValue(undefined),
      focusWindow: jest.fn().mockResolvedValue(undefined),
      typeText: jest.fn().mockResolvedValue(undefined),
    };

    const mockCommandHandler = {
      handle: jest.fn().mockImplementation(async (destination, command) => {
        if (command.killByName) {
          await mockClientService.killExeByName(destination, command.killByName);
        } else if (command.launch) {
          // Replace variables in arguments
          const args = command.arguments?.map((arg: string) => {
            if (arg === '{{login}}') {
              return 'testuser';
            }
            return arg;
          });
          await mockClientService.launchExe(destination, command.launch, args);
        }
      }),
    };

    const mockConfigService = {
      getIps: jest.fn().mockReturnValue({
        'this': '127.0.0.1',
        'touchpad': '192.168.100.39'
      }),
      getGlobalVars: jest.fn().mockReturnValue({}),
      getVariables: jest.fn().mockReturnValue({
        destination: 'touchpad',
        login: 'testuser',
        delayAfter: '5000'
      }),
      getAliases: jest.fn().mockReturnValue({}),
      getDelayBefore: jest.fn().mockReturnValue(0),
      getDelayAfter: jest.fn().mockReturnValue(0),
      parseConfig: jest.fn(),
    };

    const testModule = await Test.createTestingModule({
      providers: [
        ShortcutProcessingService,
        VariableResolutionService,
        CommandProcessingService,
        CircularIndex,
        {
          provide: CommandHandler,
          useValue: mockCommandHandler,
        },
        {
          provide: ClientService,
          useValue: mockClientService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        Logger,
      ],
    }).compile();

    const shortCutService = testModule.get<ShortcutProcessingService>(ShortcutProcessingService);
    const clientService = testModule.get<ClientService>(ClientService);
    
    const spyKillByName = jest.spyOn(clientService, 'killExeByName');
    const spyLaunchExe = jest.spyOn(clientService, 'launchExe');

    await shortCutService.processUnknownShortCut({
      commands: [
        {
          destination: 'touchpad',
          killByName: 'l2.exe'
        },
        {
          destination: 'touchpad',
          launch: 'l2.exe',
          arguments: ['--login', '{{login}}']
        }
      ],
      name: 'Launch L2 Test',
      shortCut: 'Alt+L',
    });

    expect(spyKillByName).toHaveBeenCalledWith('touchpad', 'l2.exe');
    expect(spyLaunchExe).toHaveBeenCalledWith('touchpad', 'l2.exe', ['--login', 'testuser']);
  });
});
