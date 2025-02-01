#include <napi.h>
#include <stdio.h>

Napi::Object Init (Napi::Env env, Napi::Object exports) {
    return exports;
}

NODE_API_MODULE (addon, Init)
