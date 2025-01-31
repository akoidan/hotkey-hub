/* eslint-disable */

import os from 'os';

const addon = os.platform() === 'win32' ? require('./win32/window.node') : new Proxy({}, {
  get(_, property) {
    return () => {
      throw new Error(`OS ${os.platform()} is not support to call ${property as string}`);
    };
  },
});


export function getAllWindows(): Window[] {
  return addon.getWindows().map((id: number) => {
    const initRes = addon.initWindow(id);
    return {
      id,
      path: initRes.path,
      processId: initRes.processId,
    };
  });
}

export function bringWindoToTop(windowId: number): void {
  addon.bringWindowToTop(windowId);
}
