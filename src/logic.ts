import {Aliases, ConfigCombination, Ips, Receiver, ReceiverId, ReceiverSimple} from "@/types";
import {Api} from "@/clients";

export class Logic {

  constructor(
      private ips: Ips,
      private aliases: Aliases,
  ) {

  }

  private activeFighterIndex: number = 0;
  private ids: Record<string, Api> = {};

  async createApi() {
    await Promise.all(Object.entries(this.ips).map(([name, ip]) => {
      const api = new Api(ip, name);
      this.ids[name] = api;
      const resPromise = api.connect();
      setInterval(async () => {
        await api.refreshToken();
      }, 60000);
      return resPromise;
    }));
  }

  async runCommand(currRec: Receiver) {
    if ((currRec as ReceiverSimple).keySend) {
      await this.ids[currRec.destination].sendKey((currRec as ReceiverSimple).keySend);
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
        await new Promise(resolve => setTimeout(resolve, Math.round(Math.random() * 100)));
      }
    }
  }
}