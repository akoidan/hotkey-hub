/*
 eslint-disable no-await-in-loop
 */
import {Injectable, InternalServerErrorException, Logger,} from '@nestjs/common';
import {keyboard} from '@nut-tree-fork/nut-js';
import {IKeyboardService} from '@/keyboard/keyboard-model';

@Injectable()
export class KeyboardDarwinService implements IKeyboardService {
    constructor(
        private readonly logger: Logger
    ) {
    }


    public async type(text: string): Promise<void> {
        await keyboard.type(text);
    }

    // eslint-disable-next-line
    public async sendKey(keys: string[], holdKeys: string[]): Promise<void> {
        throw new InternalServerErrorException('Not implemnted');
    }
}
