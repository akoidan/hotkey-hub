#include <napi.h>
#include <windows.h>
#include <iostream>
#include <thread>
#include <chrono>
#include <atomic>
#include <map>
#include <condition_variable>

#include "../linux/headers/validators.h"
#include "./headers/modifier-names.h"
#include "./headers/key-names.h"
#include "./headers/logger.h"

extern std::map<std::string, int> modifierNames;
extern std::map<std::string, int> keyNames;

enum RequestType {
  Register,
  Unregister
};

// Structure for registration request
struct RegistrationRequest {
  RequestType type;
  UINT modifiers;
  int vk;
  Napi::ThreadSafeFunction callback;
  bool pending = true;
  bool success = false;
  int hotkeyId = -1;
  std::string errorMessage; // Added field for error message
};

static std::thread *gPrinterThread = nullptr;
static std::atomic<bool> gThreadRunning{false};
static std::atomic<int> gNextHotkeyId{1};
static std::map<int, Napi::ThreadSafeFunction> gCallbacks;
static HWND gHwnd = NULL;

// Synchronization
static std::mutex gMutex;
static std::condition_variable gPrinterCV; // For printer thread to wait for requests
static std::condition_variable gMainCV; // For main thread to wait for results
static RegistrationRequest *gCurrentRequest = nullptr;

// Window procedure
LRESULT CALLBACK windowProc(HWND hwnd, UINT uMsg, WPARAM wParam, LPARAM lParam) {
  if (uMsg == WM_HOTKEY) {
    LOG_THREAD("Hotkey pressed! ID: " + std::to_string(wParam));
    auto it = gCallbacks.find(wParam);
    if (it != gCallbacks.end()) {
      auto callback = [wParam](Napi::Env env, Napi::Function jsCallback) {
        jsCallback.Call({Napi::Number::New(env, wParam)});
      };
      it->second.NonBlockingCall(callback);
    }
    return 0;
  }
  return DefWindowProc(hwnd, uMsg, wParam, lParam);
}

void printerThread() {
  LOG_THREAD("Starting hotkey capturing N-API thread...");

  // Register window class
  const wchar_t CLASS_NAME[] = L"HotkeyTest";
  WNDCLASSW wc = {};
  wc.lpfnWndProc = windowProc;
  wc.hInstance = GetModuleHandle(NULL);
  wc.lpszClassName = CLASS_NAME;

  if (!RegisterClassW(&wc)) {
    LOG_THREAD("Failed to register window class. Error: " << GetLastError());
    return;
  }

  // Create hidden window
  HWND hwnd = CreateWindowExW(
    0, // Optional window styles
    CLASS_NAME, // Window class
    L"Hotkey Test", // Window text
    WS_OVERLAPPED, // Window style
    0, 0, 0, 0, // Position and size
    NULL, // Parent window
    NULL, // Menu
    GetModuleHandle(NULL), // Instance handle
    NULL // Additional application data
  );

  if (hwnd == NULL) {
    LOG_THREAD("Failed to create window. Error: " << GetLastError());
    return;
  }

  gHwnd = hwnd;
  LOG_THREAD("Window created: " << std::hex << hwnd << std::dec);

  // Message loop with registration handling
  MSG msg = {};
  while (gThreadRunning) {
    // Wait for registration request or messages
    {
      std::unique_lock<std::mutex> lock(gMutex);
      while (!gCurrentRequest && gThreadRunning) {
        // Process any pending messages while waiting
        while (PeekMessage(&msg, NULL, 0, 0, PM_REMOVE)) {
          TranslateMessage(&msg);
          DispatchMessage(&msg);
        }

        // Wait with timeout to allow message processing
        gPrinterCV.wait_for(lock, std::chrono::milliseconds(100));
      }

      if (!gThreadRunning) break;

      // Process request
      if (gCurrentRequest) {
        bool success = false;
        if (gCurrentRequest->type == Register) {
          LOG_THREAD("Processing registration - modifiers: 0x" << std::hex
            << gCurrentRequest->modifiers << ", vk: 0x" << gCurrentRequest->vk
            << std::dec);

          int hotkeyId = gNextHotkeyId++;
          success = RegisterHotKey(hwnd, hotkeyId, gCurrentRequest->modifiers, gCurrentRequest->vk);

          if (!success) {
            DWORD error = GetLastError();
            if (error == ERROR_HOTKEY_ALREADY_REGISTERED) {
              gCurrentRequest->errorMessage = "Hotkey is already registered by another application";
            } else {
              gCurrentRequest->errorMessage =
                  "Failed to register hotkey. Error code: " + std::to_string(error);
            }
            LOG_THREAD(gCurrentRequest->errorMessage);
          } else {
            LOG_THREAD("Hotkey " << hotkeyId << " registered successfully");
            gCallbacks[hotkeyId] = std::move(gCurrentRequest->callback);
            gCurrentRequest->hotkeyId = hotkeyId;
          }
        } else if (gCurrentRequest->type == Unregister) {
          int hotkeyId = gCurrentRequest->hotkeyId;
          LOG_THREAD("Unregistering hotkey " << hotkeyId);
          success = UnregisterHotKey(hwnd, hotkeyId);
          if (!success) {
            DWORD error = GetLastError();
            gCurrentRequest->errorMessage =
                "Failed to unregister hotkey. Error code: " + std::to_string(error);
            LOG_THREAD(gCurrentRequest->errorMessage);
          } else {
            LOG_THREAD("Successfully unregistered hotkey " << hotkeyId);
          }
        }

        // Store result
        gCurrentRequest->success = success;
        gCurrentRequest->pending = false;

        // Notify main thread
        gMainCV.notify_one();

        // Clear current request
        gCurrentRequest = nullptr;
      }
    }
  }

  // Cleanup
  for (const auto &pair: gCallbacks) {
    UnregisterHotKey(hwnd, pair.first);
  }
  DestroyWindow(hwnd);
  if (!UnregisterClassW(CLASS_NAME, GetModuleHandle(NULL))) {
    LOG_THREAD("UnregisterClassW failed. Error: " << GetLastError());
  }
  gHwnd = NULL;
}

// Register hotkey
Napi::Value registerHotkey(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();
  GET_STRING(info, 0, keyStr);
  GET_ARRAY(info, 1, modArray);
  GET_FUNCTION(info, 2, jsCallBack);

  std::transform(keyStr.begin(), keyStr.end(), keyStr.begin(), ::tolower);

  int vk = 0;
  auto key_it = keyNames.find(keyStr);
  if (key_it != keyNames.end()) {
    vk = key_it->second;
  }

  if (vk == 0) {
    throw Napi::Error::New(env, "Invalid key name: " + keyStr);
  }


  // Get modifiers
  UINT modifiers = 0;

  for (uint32_t i = 0; i < modArray.Length(); i++) {
    Napi::Value mod = modArray[i];
    if (!mod.IsString()) continue;

    std::string modifierStr = mod.As<Napi::String>().Utf8Value();
    auto mod_it = modifierNames.find(modifierStr);
    if (mod_it != modifierNames.end()) {
      modifiers |= mod_it->second;
    }
  }

  if (!gThreadRunning) {
    gThreadRunning = true;
    gPrinterThread = new std::thread(printerThread);
  }

  int waiter = 0;
  while (!gHwnd) {
    waiter++;
    if (waiter >= 300) {
       throw Napi::TypeError::New(env, "Failed to create hotkey capturing window for over 3seconds");
    }
    std::this_thread::sleep_for(std::chrono::milliseconds(10));
  }


  // Create ThreadSafeFunction for this hotkey
  auto tsfn = Napi::ThreadSafeFunction::New(
    env,
    jsCallBack,
    "Hotkey Thread",
    0,
    1
  );

  // Create registration request
  RegistrationRequest request;
  request.type = Register;
  request.modifiers = modifiers;
  request.vk = vk;
  request.callback = std::move(tsfn);
  request.pending = true;
  request.success = false;
  request.hotkeyId = -1;

  // Send request to printer thread and wait for result
  {
    std::unique_lock<std::mutex> lock(gMutex);

    // Check if printer thread is running
    if (!gThreadRunning || !gHwnd) {
      request.callback.Release();
      throw Napi::Error::New(env, "Hotkey registration system is not initialized");
    }

    gCurrentRequest = &request;
    gPrinterCV.notify_one();

    // Wait for result with timeout
    if (!gMainCV.wait_for(lock, std::chrono::seconds(5), [&request]() { return !request.pending; })) {
      // Timeout occurred
      gCurrentRequest = nullptr; // Clear the request
      request.callback.Release();
      throw Napi::Error::New(env, "Hotkey registration timed out");
    }
  }

  // Return result
  if (!request.success) {
    request.callback.Release();
    throw Napi::Error::New(env, request.errorMessage.empty() ? "Failed to register hotkey" : request.errorMessage);
  }

  return Napi::Number::New(env, request.hotkeyId);
}

// Unregister hotkey
void unregisterHotkey(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();
  LOG_MAIN("UnregisterHotkey called");

  GET_INT_32(info, 0, hotkeyId);

  std::unique_lock<std::mutex> lock(gMutex);
  auto it = gCallbacks.find(hotkeyId);
  if (it != gCallbacks.end()) {
    // Move callback out first
    auto callback = std::move(it->second);
    gCallbacks.erase(it);

    // Send unregister request
    RegistrationRequest request;
    request.type = Unregister;
    request.hotkeyId = hotkeyId;
    request.pending = true;
    gCurrentRequest = &request;
    gPrinterCV.notify_one();

    // Wait for completion
    gMainCV.wait_for(lock, std::chrono::seconds(5));
    callback.Release();
    return;
  }

  throw Napi::Error::New(env, "Hotkey not found");
}

// Cleanup
void cleanupHotkeys(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  if (gPrinterThread) {
    gThreadRunning = false;
    gPrinterCV.notify_one(); // Wake up thread if it's waiting
    gPrinterThread->join();
    delete gPrinterThread;
    gPrinterThread = nullptr;

    // Release all callbacks
    for (auto &pair: gCallbacks) {
      pair.second.Release();
    }
    gCallbacks.clear();
  }
}

void setLoggerLevel(const Napi::CallbackInfo &info) {
  GET_BOOL(info, 0, localLog)
  logDebug = localLog;
}

void setWindowTitle(const Napi::CallbackInfo &info) {
  GET_STRING(info, 0, title);
  SetConsoleTitleA(title.c_str());
}

// Initialize module
Napi::Object initListenShortcut(Napi::Env env, Napi::Object exports) {
  exports.Set("registerHotkey", Napi::Function::New(env, registerHotkey));
  exports.Set("unregisterHotkey", Napi::Function::New(env, unregisterHotkey));
  exports.Set("cleanupHotkeys", Napi::Function::New(env, cleanupHotkeys));
  exports.Set("setLoggerLevel", Napi::Function::New(env, setLoggerLevel));
  exports.Set("setWindowTitle", Napi::Function::New(env, setWindowTitle));
  return exports;
}
