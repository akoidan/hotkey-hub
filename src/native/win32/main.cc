#include <napi.h>
#include "./headers/listen-shortcut.h"
#include "./headers/logger.h"

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    // Enable ANSI colors for Windows console once at module load
    enableAnsiColors();

    LOG_MAIN("N-API module Init called");

    // Initialize hotkey manager
    hotkey_init(env, exports);

    LOG_MAIN("N-API module Init finished");
    return exports;
}

NODE_API_MODULE(NODE_GYP_MODULE_NAME, Init)
