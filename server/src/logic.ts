import {
  Aliases,
  ConfigCombination,
  Ips,
  Receiver,
  ReceiverId,
  ReceiverSimple
} from "@/types";
import { ApiV2 } from '@/clientsv2';

export class Logic {

  constructor(
      private ips: Ips,
      private aliases: Aliases,
      private delay: number,
  ) {

  }

  private activeFighterIndex: number = 0;
  private ids: Record<string, ApiV2> = {};

  async createApi() {
    await Promise.all(Object.entries(this.ips).map(([name, ip]) => {
      const api = new ApiV2(ip, name);
      this.ids[name] = api;
      return api.ping();
    }));
  }

  async runCommand(currRec: Receiver) {
    if ((currRec as ReceiverSimple).keySend) {
      await this.ids[currRec.destination].sendKey({key: (currRec as ReceiverSimple).keySend});
    } else {
      await this.ids[currRec.destination].sendCustomKey((currRec as ReceiverId).id, (currRec as ReceiverId).run);
    }
  }


  async sendKeyToApi(comb: ConfigCombination) {
    console.log(`${comb.shortCut} pressed`);
    // but same as receiver but destination would be an ip
    const receivers: Receiver[] = [];
    comb.receivers.forEach(rec => {
      this.aliases[rec.destination].forEach(dest => {
        receivers.push({
          ...rec,
          destination: dest,
        })
      })
    })
    if (comb.shuffle) {
      this.shuffle(receivers);
    }

    // const receivers: string[] = comb.receivers.map(rec => this.config.urls[rec as keyof ConfigUrl]).flatMap(a => a);
    if (comb.circular && receivers.length > 0) {
      await this.runCommand(receivers[this.activeFighterIndex]);
      if (this.activeFighterIndex >= receivers.length - 1) {
        this.activeFighterIndex = 0;
      } else {
        this.activeFighterIndex++;
      }
    } else {
      for (let i = 0; i < receivers.length; i++) {
        await this.runCommand(receivers[i]);
        let delay = comb.delay;
        if (receivers[i].delay !== undefined) {
          delay = receivers[i].delay;
        }
        if (delay === undefined) {
          delay = Math.round(Math.random() * this.delay)
        }
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Fisher-Yates (Knuth) shuffle
   */
  private shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}
