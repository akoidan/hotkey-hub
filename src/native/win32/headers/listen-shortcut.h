#pragma once
#include <napi.h>

Napi::Value registerHotkey(const Napi::CallbackInfo &info);

Napi::Value unregisterHotkey(const Napi::CallbackInfo &info);

Napi::Value cleanupHotkeys(const Napi::CallbackInfo &info);

Napi::Object init(Napi::Env env, Napi::Object exports);