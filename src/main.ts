import {
  app,
  globalShortcut
} from 'electron'
import { ConfigReader } from '@/config';
import {
  ConfigCombination,
  ConfigData, Receiver, ReceiverId, ReceiverSimple,
} from '@/types';
import { Api } from '@/clients';
import "@/show-readme"

class ShortCutSender {

  private ids: Record<string, Api> = {};
  private config: ConfigData;
  private activeFighterIndex: number = 0;

  async sendKeyToApi(comb: ConfigCombination) {
    console.log(`${comb.shortCut} pressed`);

    // but same as receiver but destination would be an ip
    const receivers: Receiver[] = [];
    comb.receivers.forEach(rec => {
      this.config.aliases[rec.destination].forEach(dest => {
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
        this.activeFighterIndex ++;
      }
    } else {
      for (let i = 0; i < receivers.length; i++) {
        await this.runCommand(receivers[i]);
        await new Promise(resolve => setTimeout(resolve, Math.round(Math.random()*100)));
      }
    }
  }

  async runCommand(currRec: Receiver) {
    if ((currRec as ReceiverSimple).keySend) {
      await this.ids[currRec.destination].sendKey((currRec as ReceiverSimple).keySend);
    } else {
      await this.ids[currRec.destination].sendCustomKey((currRec as ReceiverId).id, (currRec as ReceiverId).run);
    }
  }

  async createApi() {
    await Promise.all(Object.entries(this.config.ips).map(([name, ip]) => {
      const api = new Api(ip, name);
      this.ids[name] = api;
      return api.connect();
    }));
  }

  async start() {
    await app.whenReady();
    app.on('will-quit', () => {
      globalShortcut.unregister('Alt+1')
      globalShortcut.unregisterAll()
    });
    try {
      const configReader = new ConfigReader();
      this.config = await configReader.getConfig();
      await this.createApi();
      this.config.combinations.forEach(comb => {
        const ret = globalShortcut.register(comb.shortCut, () => {
          void this.sendKeyToApi(comb);
        })
        if (!ret) {
          console.log('registration failed')
        }
      });
    } catch (e) {
      console.error(e);
      app.exit(1);
    }

  }
}

new ShortCutSender().start();

