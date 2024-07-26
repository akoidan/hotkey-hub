import {app, globalShortcut} from 'electron'
import {ConfigReader} from '@/config';
import {Logic} from "@/logic";
import { ConfigCombination } from '@/types';


async function start(): Promise<void> {
  await app.whenReady();
  app.on('will-quit', () => {
    globalShortcut.unregisterAll()
  });
  try {
    const configReader = new ConfigReader();
    const config = await configReader.getConfig();
    const logic = new Logic(config.ips, config.aliases, config.delay);
    await logic.createApi();
    config.combinations.forEach((comb: ConfigCombination)  => {
      const ret = globalShortcut.register(comb.shortCut, () => logic.sendKeyToApi(comb))
      if (!ret) {
        throw Error('registration failed')
      }
    });
  } catch (e) {
    console.error('Application bootstrap has failed');
    console.error(e);
    app.exit(1);
  }
}

start();

