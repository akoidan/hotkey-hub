#include <napi.h>
#include <stdio.h>
#include <unistd.h>
#include <vector>
#include <string>
#include <cstring>
#include <memory>
#include <sstream>
#include <X11/Xlib.h>
#include <X11/Xatom.h>
#include <X11/Xutil.h>

#define DEBUG_LOG(fmt, ...) fprintf(stderr, "[window-linux] " fmt "\n", ##__VA_ARGS__)

struct WindowInfo {
    unsigned long id;
    pid_t pid;
};

// Helper function to execute a command and get its output
std::string exec_command(const char* cmd) {
    std::array<char, 128> buffer;
    std::string result;
    DEBUG_LOG("Executing command: %s", cmd);
    
    std::unique_ptr<FILE, decltype(&pclose)> pipe(popen(cmd, "r"), pclose);
    if (!pipe) {
        DEBUG_LOG("Failed to execute command");
        return "";
    }
    
    while (fgets(buffer.data(), buffer.size(), pipe.get()) != nullptr) {
        result += buffer.data();
    }
    
    return result;
}

// Helper function to get process path from PID
std::string get_process_path(pid_t pid) {
    if (pid <= 0) return "";
    
    char path[1024];
    char proc_path[1024];
    snprintf(proc_path, sizeof(proc_path), "/proc/%d/exe", pid);
    
    ssize_t len = readlink(proc_path, path, sizeof(path)-1);
    if (len != -1) {
        path[len] = '\0';
        return std::string(path);
    }
    return "";
}

// Global X11 connection
static Display* display = nullptr;
static Atom net_active_window;

// Initialize X11 if not already initialized
bool ensure_x11_initialized() {
    if (!display) {
        XInitThreads();
        display = XOpenDisplay(nullptr);
        if (!display) {
            DEBUG_LOG("Failed to open X11 display");
            return false;
        }
        net_active_window = XInternAtom(display, "_NET_ACTIVE_WINDOW", False);
        DEBUG_LOG("X11 initialized successfully");
    }
    return true;
}

// Get all windows using wmctrl
std::vector<WindowInfo> get_all_windows() {
    std::vector<WindowInfo> windows;
    
    // Get window list using wmctrl
    std::string output = exec_command("wmctrl -l -p");
    if (output.empty()) {
        DEBUG_LOG("No windows found or wmctrl failed");
        return windows;
    }
    
    // Parse wmctrl output
    std::istringstream stream(output);
    std::string line;
    
    while (std::getline(stream, line)) {
        DEBUG_LOG("Processing window line: %s", line.c_str());
        
        unsigned long id;
        pid_t pid;
        
        if (sscanf(line.c_str(), "%lx %*s %d", &id, &pid) == 2) {
            WindowInfo info = {id, pid};
            windows.push_back(info);
            DEBUG_LOG("Added window - ID: %lu, PID: %d", id, pid);
        }
    }
    
    return windows;
}

Napi::Array getWindows(const Napi::CallbackInfo& info) {
    DEBUG_LOG("getWindows called");
    Napi::Env env = info.Env();
    auto windows = get_all_windows();
    
    auto arr = Napi::Array::New(env);
    for (size_t i = 0; i < windows.size(); i++) {
        arr.Set(i, Napi::Number::New(env, static_cast<int64_t>(windows[i].id)));
    }
    
    DEBUG_LOG("Returning %zu windows", windows.size());
    return arr;
}

Napi::Object initWindow(const Napi::CallbackInfo& info) {
    DEBUG_LOG("initWindow called");
    Napi::Env env = info.Env();
    
    unsigned long window_id = static_cast<unsigned long>(info[0].ToNumber().Int64Value());
    DEBUG_LOG("Window ID: %lu", window_id);
    
    // Get window list to find PID
    auto windows = get_all_windows();
    pid_t pid = 0;
    
    for (const auto& window : windows) {
        if (window.id == window_id) {
            pid = window.pid;
            break;
        }
    }
    
    std::string path = get_process_path(pid);
    DEBUG_LOG("Result - PID: %d, Path: %s", pid, path.c_str());
    
    Napi::Object obj = Napi::Object::New(env);
    obj.Set("processId", Napi::Number::New(env, pid));
    obj.Set("path", Napi::String::New(env, path));
    
    return obj;
}

Napi::Boolean bringWindowToTop(const Napi::CallbackInfo& info) {
    DEBUG_LOG("bringWindowToTop called");
    Napi::Env env = info.Env();
    
    if (!ensure_x11_initialized()) {
        return Napi::Boolean::New(env, false);
    }
    
    Window window_id = static_cast<Window>(info[0].ToNumber().Int64Value());
    
    // Send _NET_ACTIVE_WINDOW message
    XEvent event;
    memset(&event, 0, sizeof(event));
    
    event.type = ClientMessage;
    event.xclient.window = window_id;
    event.xclient.message_type = net_active_window;
    event.xclient.format = 32;
    event.xclient.data.l[0] = 2; // Source indication: 2 = pager
    event.xclient.data.l[1] = CurrentTime;
    event.xclient.data.l[2] = 0;
    
    Window root = DefaultRootWindow(display);
    XSendEvent(display, root, False,
               SubstructureNotifyMask | SubstructureRedirectMask,
               &event);
    
    // Also use traditional method as fallback
    XRaiseWindow(display, window_id);
    XSetInputFocus(display, window_id, RevertToParent, CurrentTime);
    XFlush(display);
    
    DEBUG_LOG("Window activation request sent");
    return Napi::Boolean::New(env, true);
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    DEBUG_LOG("Initializing module");
    exports.Set("getWindows", Napi::Function::New(env, getWindows));
    exports.Set("initWindow", Napi::Function::New(env, initWindow));
    exports.Set("bringWindowToTop", Napi::Function::New(env, bringWindowToTop));
    return exports;
}

NODE_API_MODULE(addon, Init)
