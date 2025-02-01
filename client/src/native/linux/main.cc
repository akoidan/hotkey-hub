#include <napi.h>

// Window management functions
Napi::Object window_init(Napi::Env env, Napi::Object exports);

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    // Initialize window management
    window_init(env, exports);

    return exports;
}

NODE_API_MODULE(NODE_GYP_MODULE_NAME, Init)
