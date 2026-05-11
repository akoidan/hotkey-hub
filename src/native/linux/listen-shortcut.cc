#include "./headers/listen-shortcut.h"
#include "./headers/key-names.h"
#include "./headers/modifier-names.h"
#include "./headers/validators.h"
#include "./headers/logger.h"
#include <napi.h>
#include <thread>
#include <atomic>
#include <chrono>

struct HotkeyContext {
  std::atomic<bool> running{true};
  Napi::ThreadSafeFunction tsfn;
  std::thread eventThread;
  Display *display;
  Window root;
  unsigned int modifiers;
  KeyCode keycode;
};


KeySym keyCodeForChar(const char c) {
  KeySym code;

  char buf[2];
  buf[0] = c;
  buf[1] = '\0';

  code = XStringToKeysym(buf);
  if (code == NoSymbol) {
    auto it = xSpecialCharacterMap.find(c);
    if (it != xSpecialCharacterMap.end()) {
      code = it->second;
    } else {
      auto shiftIt = xShiftRequiredMap.find(c);
      if (shiftIt != xShiftRequiredMap.end()) {
        code = shiftIt->second;
      }
    }
  }

  return code;
}

static std::unordered_map<int, HotkeyContext *> hotkeyContexts;
static int nextHotkeyId = 1;

void eventLoop(HotkeyContext *context) {
  XEvent event;

  while (context->running) {
    // Use non-blocking event checking
    if (XPending(context->display)) {
      XNextEvent(context->display, &event);

      if (event.type == KeyPress) {
        unsigned int modifiers = event.xkey.state;
        KeyCode keycode = event.xkey.keycode;

        // Check if this matches our registered hotkey
        if (keycode == context->keycode && modifiers == context->modifiers) {
          auto callback = [](Napi::Env env, Napi::Function jsCallback) {
            jsCallback.Call({});
          };

          context->tsfn.BlockingCall(callback);
        }
      }
    } else {
      // Sleep briefly to avoid busy waiting
      std::this_thread::sleep_for(std::chrono::milliseconds(10));
    }
  }
}

Napi::Value registerHotkey(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  // Get key string
  GET_STRING(info, 0, keyStr);

  // Get modifiers array
  GET_ARRAY(info, 1, modArray);

  // Get callback
  GET_FUNCTION(info, 2, jsCallBack);

  Display *display = XOpenDisplay(NULL);
  if (!display) {
    throw Napi::Error::New(env, "Failed to open X display");
  }

  // Convert key string to KeySym
  KeySym keysym = NoSymbol;
  for (int i = 0; keyNames[i].name != NULL; i++) {
    if (keyStr == keyNames[i].name) {
      keysym = keyNames[i].key;
      break;
    }
  }

  if (keysym == NoSymbol) {
    // Try as a single character
    if (keyStr.length() == 1) {
      char c = tolower(keyStr[0]);
      keysym = keyCodeForChar(c);
    }
  }

  if (keysym == NoSymbol) {
    XCloseDisplay(display);
    throw Napi::Error::New(env, "Invalid key name");
  }

  // Convert modifiers array to mask
  unsigned int modifiers = 0;
  for (uint32_t i = 0; i < modArray.Length(); i++) {
    Napi::Value mod = modArray[i];
    if (!mod.IsString()) continue;

    std::string modStr = mod.As<Napi::String>().Utf8Value();
    auto it = modifierNames.find(modStr);
    if (it != modifierNames.end()) {
      modifiers |= it->second;
    }
  }

  KeyCode keycode = XKeysymToKeycode(display, keysym);
  if (keycode == 0) {
    XCloseDisplay(display);
    throw Napi::Error::New(env, "Could not map key to keycode");
  }

  Window root = DefaultRootWindow(display);
  XGrabKey(display, keycode, modifiers, root, True, GrabModeAsync, GrabModeAsync);
  XSelectInput(display, root, KeyPressMask);

  // Create hotkey context
  HotkeyContext *context = new HotkeyContext();
  context->display = display;
  context->root = root;
  context->modifiers = modifiers;
  context->keycode = keycode;
  context->tsfn = Napi::ThreadSafeFunction::New(
    env,
    jsCallBack,
    "Hotkey Callback",
    0,
    1
  );

  // Start event thread
  context->eventThread = std::thread(eventLoop, context);

  int hotkeyId = nextHotkeyId++;
  hotkeyContexts[hotkeyId] = context;

  return Napi::Number::New(env, hotkeyId);
}

void unregisterHotkey(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  GET_INT_32(info, 0, hotkeyId);
  auto it = hotkeyContexts.find(hotkeyId);

  if (it != hotkeyContexts.end()) {
    HotkeyContext *context = it->second;
    context->running = false;

    // Ungrab the key
    XUngrabKey(context->display, context->keycode, context->modifiers, context->root);

    // Clean up
    context->eventThread.join();
    context->tsfn.Release();
    XCloseDisplay(context->display);
    delete context;

    hotkeyContexts.erase(it);
  }
}

void cleanupHotkeys(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  for (auto &pair: hotkeyContexts) {
    HotkeyContext *context = pair.second;
    context->running = false;

    // Ungrab the key
    XUngrabKey(context->display, context->keycode, context->modifiers, context->root);

    // Clean up
    context->eventThread.join();
    context->tsfn.Release();
    XCloseDisplay(context->display);
    delete context;
  }

  hotkeyContexts.clear();
}

void setLoggerLevel(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  GET_BOOL(info, 0, localLog);
  logDebug = localLog;
}

void setWindowTitle(const Napi::CallbackInfo &info) {
  GET_STRING(info, 0, title);
  // TODO
}

Napi::Object initListenShortcut(Napi::Env env, Napi::Object exports) {
  exports.Set("registerHotkey", Napi::Function::New(env, registerHotkey));
  exports.Set("unregisterHotkey", Napi::Function::New(env, unregisterHotkey));
  exports.Set("cleanupHotkeys", Napi::Function::New(env, cleanupHotkeys));
  exports.Set("setLoggerLevel", Napi::Function::New(env, setLoggerLevel));
  exports.Set("setWindowTitle", Napi::Function::New(env, setWindowTitle));
  return exports;
}
