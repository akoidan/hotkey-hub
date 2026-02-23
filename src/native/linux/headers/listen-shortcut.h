#pragma once

#include <napi.h>

// Initialize hotkey functionality and register Node.js functions
Napi::Object initListenShortcut(Napi::Env env, Napi::Object exports);
