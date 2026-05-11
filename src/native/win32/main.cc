#include <napi.h>
#include "./headers/listen-shortcut.h"
#include "./headers/openrgb-client.h"
#include "./headers/logger.h"

Napi::Object init(Napi::Env env, Napi::Object exports) {
  // Enable ANSI colors for Windows console once at module load
  enableAnsiColors();
  // Initialize hotkey manager
  initListenShortcut(env, exports);
  // Initialize OpenRGB client
  initOpenRgb(env, exports);
  return exports;
}

NODE_API_MODULE(NODE_GYP_MODULE_NAME, init)