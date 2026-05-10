// OpenRGB TCP client – POSIX sockets implementation.
// connect() and getDevices() return Promises (spawn a thread, resolve/reject via TSFN).
// setCustomMode / updateAllLeds / updateSingleLed / disconnect are sync; they throw on send failure.

#include <napi.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <netdb.h>
#include <unistd.h>
#include <fcntl.h>
#include <errno.h>
#include <sys/select.h>
#include <sys/time.h>
#include <thread>
#include <string>
#include <vector>
#include <stdexcept>
#include <cstdint>
#include <algorithm>
#include <cstdio>
#include <sstream>
#include <iomanip>
#include <atomic>
#include <chrono>

#include "./headers/logger.h"
#include "./headers/validators.h"

// ── Wire constants ─────────────────────────────────────────────────────────────

static const uint32_t HEADER_SIZE = 16;
static const uint32_t PROTO_VER   = 3;

enum OrgbCommand : uint32_t {
  CMD_CONTROLLER_COUNT  = 0,
  CMD_CONTROLLER_DATA   = 1,
  CMD_PROTOCOL_VERSION  = 40,
  CMD_CLIENT_NAME       = 50,
  CMD_UPDATE_LEDS       = 1050,
  CMD_UPDATE_SINGLE_LED = 1052,
  CMD_SET_CUSTOM_MODE   = 1100,
};

// ── Data structures ────────────────────────────────────────────────────────────

struct RgbColor  { uint8_t red, green, blue; };
struct RgbLed    { std::string name; };
struct RgbDevice {
  uint32_t            deviceId;
  std::string         name;
  std::vector<RgbLed> leds;
  uint32_t            colorCount;
};

// ── Socket state ───────────────────────────────────────────────────────────────

static int              gSocket = -1;
static uint32_t         gProto  = 0;
static std::atomic<uint64_t> gMonitorGen{0};
static std::atomic<bool>     gExpectingDisconnect{false};
static std::atomic<bool>     gConnected{false};  // true only after full handshake

// ── Wire utilities ─────────────────────────────────────────────────────────────
//
// Two overloads for each direction:
//   sendPacket(devId, cmd, body, len)      – for background threads, throws std::runtime_error
//   sendPacket(env, devId, cmd, body, len) – for N-API callbacks,    throws Napi::Error
//
// recvAll / recvPacket are only called from background threads (sync ops are fire-and-forget).

static void recvAll(uint8_t* buf, int len) {
  int rcvd = 0;
  while (rcvd < len) {
    ssize_t r = ::recv(gSocket, reinterpret_cast<char*>(buf + rcvd), len - rcvd, 0);
    if (r == 0) throw std::runtime_error("connection closed by server");
    if (r  < 0) throw std::runtime_error("recv failed (" + std::to_string(errno) + ")");
    rcvd += static_cast<int>(r);
  }
}

static std::vector<uint8_t> recvPacket(uint32_t& outCmd) {
  uint8_t hdr[HEADER_SIZE];
  recvAll(hdr, HEADER_SIZE);
  if (hdr[0]!='O'||hdr[1]!='R'||hdr[2]!='G'||hdr[3]!='B')
    throw std::runtime_error("invalid magic bytes in response header");
  uint32_t bodyLen;
  memcpy(&outCmd,  hdr +  8, 4);
  memcpy(&bodyLen, hdr + 12, 4);
  std::vector<uint8_t> body(bodyLen);
  if (bodyLen > 0) recvAll(body.data(), static_cast<int>(bodyLen));
  return body;
}

// Thread-path sendPacket – throws std::runtime_error
static void sendPacket(uint32_t devId, uint32_t cmd,
                       const uint8_t* body, uint32_t bodyLen) {
  uint8_t hdr[HEADER_SIZE];
  hdr[0]='O'; hdr[1]='R'; hdr[2]='G'; hdr[3]='B';
  memcpy(hdr +  4, &devId,   4);
  memcpy(hdr +  8, &cmd,     4);
  memcpy(hdr + 12, &bodyLen, 4);

  auto rawSend = [](const uint8_t* buf, int len) {
    int sent = 0;
    while (sent < len) {
      ssize_t r = ::send(gSocket, reinterpret_cast<const char*>(buf + sent), len - sent, 0);
      if (r < 0) {
        int e = errno;
        throw std::runtime_error("send failed (" + std::to_string(e) + ")");
      }
      sent += static_cast<int>(r);
    }
  };
  rawSend(hdr, HEADER_SIZE);
  if (bodyLen > 0) rawSend(body, static_cast<int>(bodyLen));
}

// N-API sync-path sendPacket – throws Napi::Error
static void sendPacket(Napi::Env env, uint32_t devId, uint32_t cmd,
                       const uint8_t* body, uint32_t bodyLen) {
  uint8_t hdr[HEADER_SIZE];
  hdr[0]='O'; hdr[1]='R'; hdr[2]='G'; hdr[3]='B';
  memcpy(hdr +  4, &devId,   4);
  memcpy(hdr +  8, &cmd,     4);
  memcpy(hdr + 12, &bodyLen, 4);

  auto napiSend = [env](const uint8_t* buf, int len) {
    int sent = 0;
    while (sent < len) {
      ssize_t r = ::send(gSocket, reinterpret_cast<const char*>(buf + sent), len - sent, 0);
      if (r < 0) {
        int e = errno;
        throw Napi::Error::New(env, "send failed (" + std::to_string(e) + ")");
      }
      sent += static_cast<int>(r);
    }
  };
  napiSend(hdr, HEADER_SIZE);
  if (bodyLen > 0) napiSend(body, static_cast<int>(bodyLen));
}

// ── Buffer reader ──────────────────────────────────────────────────────────────

struct BufReader {
  const uint8_t* data;
  size_t pos, len;
  std::string section;

  std::string hexAt(size_t p, size_t count = 16) const {
    std::ostringstream ss;
    size_t end = (std::min)(p + count, len);
    for (size_t i = p; i < end; ++i)
      ss << std::hex << std::setw(2) << std::setfill('0') << (int)data[i] << ' ';
    return ss.str();
  }

  template<typename T> T read() {
    if (pos + sizeof(T) > len)
      throw std::runtime_error("[" + section + "] overrun reading " +
        std::to_string(sizeof(T)) + "B at pos=" + std::to_string(pos) + " len=" + std::to_string(len));
    T v; memcpy(&v, data + pos, sizeof(T)); pos += sizeof(T); return v;
  }
  std::string readStr() {
    uint16_t n = read<uint16_t>();
    if (pos + n > len)
      throw std::runtime_error("[" + section + "] buffer overrun in string: claimed len=" +
        std::to_string(n) + " pos=" + std::to_string(pos) + " buf=" + std::to_string(len) +
        " bytes@(pos-2): " + hexAt(pos - 2, 16));
    std::string s(reinterpret_cast<const char*>(data + pos), n > 0 ? n - 1 : 0);
    pos += n; return s;
  }
  void skip(size_t n) {
    if (pos + n > len)
      throw std::runtime_error("[" + section + "] overrun in skip: " +
        std::to_string(n) + "B at pos=" + std::to_string(pos) + " len=" + std::to_string(len));
    pos += n;
  }
};

// ── Controller data parser ─────────────────────────────────────────────────────

static RgbDevice parseDevice(const std::vector<uint8_t>& body, uint32_t proto,
                              uint32_t deviceId) {
  BufReader r{body.data(), 0, body.size(), "header"};
  RgbDevice dev;
  dev.deviceId = deviceId;

  r.skip(4);  // data_size
  r.skip(4);  // type (uint32_t device-type enum)
  dev.name = r.readStr();

  r.section = "strings";
  if (proto >= 1) r.readStr();  // vendor
  r.readStr(); r.readStr(); r.readStr(); r.readStr();  // description, version, serial, location

  r.section = "modes";
  uint16_t numModes = r.read<uint16_t>();
  r.skip(4);  // active_mode (int32_t)
  for (uint16_t m = 0; m < numModes; ++m) {
    r.section = "mode[" + std::to_string(m) + "]";
    r.readStr();
    r.skip(4 + 4 + 4 + 4);      // value + flags + speed_min + speed_max
    if (proto >= 3) r.skip(8);   // brightness_min + brightness_max
    r.skip(4 + 4 + 4);           // colors_min + colors_max + speed
    if (proto >= 3) r.skip(4);   // brightness
    r.skip(4 + 4);               // direction + color_mode
    uint16_t nc = r.read<uint16_t>();
    r.skip(static_cast<size_t>(nc) * 4);
  }

  r.section = "zones";
  uint16_t numZones = r.read<uint16_t>();
  for (uint16_t z = 0; z < numZones; ++z) {
    r.section = "zone[" + std::to_string(z) + "]";
    r.readStr();
    r.skip(4 + 4 + 4 + 4);  // type + leds_min + leds_max + leds_count
    uint16_t ml = r.read<uint16_t>();
    r.skip(ml);
  }

  r.section = "leds";
  uint16_t numLeds = r.read<uint16_t>();
  dev.leds.resize(numLeds);
  for (uint16_t i = 0; i < numLeds; ++i) {
    r.section = "led[" + std::to_string(i) + "]";
    dev.leds[i].name = r.readStr();
    r.skip(4);  // value
  }

  r.section = "colors";
  dev.colorCount = r.read<uint16_t>();
  return dev;
}

// ── Disconnect detection ───────────────────────────────────────────────────────

static void rgbRegisterDCEvent(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (info.Length() < 1 || !info[0].IsFunction())
    throw Napi::TypeError::New(env, "Expected callback function");
  if (gSocket == -1)
    throw Napi::Error::New(env, "not connected");

  uint64_t myGen = ++gMonitorGen;

  auto tsfn = Napi::ThreadSafeFunction::New(
    env, info[0].As<Napi::Function>(), "RgbDcEvent", 0, 1);

  std::thread([tsfn, myGen]() mutable {
    while (gMonitorGen == myGen) {
      // Only poll when a full handshake has completed
      if (!gConnected) {
        std::this_thread::sleep_for(std::chrono::milliseconds(200));
        continue;
      }
      int sock = gSocket;
      if (sock == -1) {
        std::this_thread::sleep_for(std::chrono::milliseconds(200));
        continue;
      }
      fd_set rfds;
      FD_ZERO(&rfds);
      FD_SET(sock, &rfds);
      timeval tv{0, 200000};  // 200 ms poll
      select(sock + 1, &rfds, nullptr, nullptr, &tv);
      if (gMonitorGen != myGen) break;
      if (gSocket != sock) continue;  // reconnect replaced the socket mid-poll
      if (!FD_ISSET(sock, &rfds)) continue;
      char buf[1];
      ssize_t n = ::recv(sock, buf, 1, MSG_PEEK);
      if (n == 0 || n < 0) {
        gConnected = false;  // mark disconnected before waiting / firing callback
        if (!gExpectingDisconnect && gMonitorGen == myGen) {
          tsfn.BlockingCall([](Napi::Env e, Napi::Function fn) {
            fn.Call(e.Undefined(), {});
          });
        }
        // Wait until a new successful connection is fully established
        while (gMonitorGen == myGen && !gConnected) {
          std::this_thread::sleep_for(std::chrono::milliseconds(100));
        }
      }
    }
    tsfn.Release();
  }).detach();
}

// ── Async: connect → Promise<void> ────────────────────────────────────────────

static void doConnect(const std::string& host, uint32_t port,
                      const std::string& clientName) {
  gExpectingDisconnect = false;
  gConnected = false;
  if (gSocket != -1) {
    close(gSocket);
    gSocket = -1;
  }

  gSocket = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
  if (gSocket == -1) {
    throw std::runtime_error("socket() failed (" + std::to_string(errno) + ")");
  }

  try {
    addrinfo hints{}, *res = nullptr;
    hints.ai_family   = AF_INET;
    hints.ai_socktype = SOCK_STREAM;
    if (getaddrinfo(host.c_str(), std::to_string(port).c_str(), &hints, &res) != 0) {
      throw std::runtime_error("getaddrinfo failed (" + std::to_string(errno) + ")");
    }

    // Non-blocking connect so we can enforce a timeout via select()
    int origFlags = fcntl(gSocket, F_GETFL, 0);
    fcntl(gSocket, F_SETFL, origFlags | O_NONBLOCK);
    ::connect(gSocket, res->ai_addr, static_cast<socklen_t>(res->ai_addrlen));
    freeaddrinfo(res);

    fd_set wfds, efds;
    FD_ZERO(&wfds); FD_SET(gSocket, &wfds);
    FD_ZERO(&efds); FD_SET(gSocket, &efds);
    timeval tv{5, 0};
    int sel = select(gSocket + 1, nullptr, &wfds, &efds, &tv);

    if (sel == 0) {
      throw std::runtime_error("connect timed out after 5 seconds");
    }
    if (sel < 0 || FD_ISSET(gSocket, &efds)) {
      throw std::runtime_error("connect failed (" + std::to_string(errno) + ")");
    }

    int soErr = 0;
    socklen_t soLen = sizeof(soErr);
    getsockopt(gSocket, SOL_SOCKET, SO_ERROR, &soErr, &soLen);
    if (soErr != 0)
      throw std::runtime_error("connect error (" + std::to_string(soErr) + ")");

    fcntl(gSocket, F_SETFL, origFlags);  // restore blocking mode
    timeval to{5, 0};
    setsockopt(gSocket, SOL_SOCKET, SO_RCVTIMEO, &to, sizeof(to));
    setsockopt(gSocket, SOL_SOCKET, SO_SNDTIMEO, &to, sizeof(to));

    // Protocol version negotiation
    uint32_t cv = PROTO_VER;
    sendPacket(0, CMD_PROTOCOL_VERSION, reinterpret_cast<uint8_t*>(&cv), 4);
    uint32_t cmd;
    auto body = recvPacket(cmd);
    if (body.size() >= 4) {
      uint32_t sv; memcpy(&sv, body.data(), 4);
      gProto = (std::min)(sv, PROTO_VER);
    }

    // Announce client name (no response expected)
    std::string nameBody = clientName + '\0';
    sendPacket(0, CMD_CLIENT_NAME,
               reinterpret_cast<const uint8_t*>(nameBody.data()),
               static_cast<uint32_t>(nameBody.size()));

    gConnected = true;  // handshake complete – monitor may now poll this socket
  } catch (...) {
    close(gSocket);
    gSocket = -1;
    throw;
  }
}

static Napi::Value rgbConnect(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  GET_STRING_UTF8(info, 0, host);
  GET_UINT_32(info, 1, port, uint32_t);
  GET_STRING_UTF8(info, 2, clientName);

  auto deferred = Napi::Promise::Deferred::New(env);
  auto tsfn = Napi::ThreadSafeFunction::New(
    env,
    Napi::Function::New(env, [](const Napi::CallbackInfo&){}),
    "RgbConnect",
    0,
    1
  );

  std::thread([deferred, tsfn, host, port, clientName]() mutable {
    std::string err;
    try {
      doConnect(host, port, clientName);
    } catch (const std::exception& e) {
      err = e.what();
    }
    tsfn.BlockingCall([deferred, err](Napi::Env env, Napi::Function) mutable {
      if (err.empty()) {
        deferred.Resolve(env.Undefined());
      } else {
        deferred.Reject(Napi::Error::New(env, err).Value());
      }
    });
    tsfn.Release();
  }).detach();

  return deferred.Promise();
}

// ── Async: getDevices → Promise<RgbDevice[]> ──────────────────────────────────

struct GetDevicesResult {
  std::string            error;
  std::vector<RgbDevice> devices;
};

static void doGetDevices(std::vector<RgbDevice>& devices) {
  uint32_t cmd;
  sendPacket(0, CMD_CONTROLLER_COUNT, nullptr, 0);
  auto body = recvPacket(cmd);
  if (body.size() < 4) {
    throw std::runtime_error("short controller count response");
  }

  uint32_t count; memcpy(&count, body.data(), 4);
  devices.resize(count);

  for (uint32_t i = 0; i < count; ++i) {
    uint32_t proto = gProto;
    sendPacket(i, CMD_CONTROLLER_DATA, reinterpret_cast<uint8_t*>(&proto), 4);
    body       = recvPacket(cmd);
    devices[i] = parseDevice(body, gProto, i);
  }
}

static Napi::Value rgbGetDevices(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  auto deferred = Napi::Promise::Deferred::New(env);
  auto tsfn = Napi::ThreadSafeFunction::New(
    env, Napi::Function::New(env, [](const Napi::CallbackInfo&){}),
    "RgbGetDevices", 0, 1);

  std::thread([deferred, tsfn]() mutable {
    auto* result = new GetDevicesResult{};
    try { doGetDevices(result->devices); }
    catch (const std::exception& e) { result->error = e.what(); }

    tsfn.BlockingCall(result, [deferred](Napi::Env env, Napi::Function, GetDevicesResult* res) {
      if (!res->error.empty()) {
        deferred.Reject(Napi::Error::New(env, res->error).Value());
      } else {
        Napi::Array arr = Napi::Array::New(env, res->devices.size());
        for (size_t i = 0; i < res->devices.size(); ++i) {
          const RgbDevice& dev = res->devices[i];
          Napi::Array leds = Napi::Array::New(env, dev.leds.size());
          for (size_t j = 0; j < dev.leds.size(); ++j) {
            Napi::Object led = Napi::Object::New(env);
            led.Set("name", Napi::String::New(env, dev.leds[j].name));
            leds[j] = led;
          }
          Napi::Object obj = Napi::Object::New(env);
          obj.Set("deviceId",   Napi::Number::New(env, dev.deviceId));
          obj.Set("name",       Napi::String::New(env, dev.name));
          obj.Set("leds",       leds);
          obj.Set("colorCount", Napi::Number::New(env, dev.colorCount));
          arr[i] = obj;
        }
        deferred.Resolve(arr);
      }
      delete res;
    });
    tsfn.Release();
  }).detach();

  return deferred.Promise();
}

// ── Sync fire-and-forget ───────────────────────────────────────────────────────

// rgbSetCustomMode(deviceId: number): void
static void rgbSetCustomMode(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (gSocket == -1) {
    throw Napi::Error::New(env, "not connected");
  }
  GET_UINT_32(info, 0, deviceId, uint32_t);
  sendPacket(env, deviceId, CMD_SET_CUSTOM_MODE, nullptr, 0);
}

// rgbUpdateAllLeds(deviceId: number, colors: { red, green, blue }[]): void
static void rgbUpdateAllLeds(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (gSocket == -1) throw Napi::Error::New(env, "not connected");
  GET_UINT_32(info, 0, deviceId, uint32_t);
  ASSERT_ARRAY(info, 1);
  Napi::Array arr = info[1].As<Napi::Array>();
  uint32_t n = arr.Length();

  // body = uint32_t(data_size) + uint16_t(count) + n × [R G B 0]
  uint32_t dataSize = static_cast<uint32_t>(4 + 2 + static_cast<size_t>(n) * 4);
  std::vector<uint8_t> body(dataSize);
  memcpy(body.data(), &dataSize, 4);
  uint16_t n16 = static_cast<uint16_t>(n);
  memcpy(body.data() + 4, &n16, 2);
  for (uint32_t i = 0; i < n; ++i) {
    Napi::Object c = arr.Get(i).As<Napi::Object>();
    size_t off     = 6 + static_cast<size_t>(i) * 4;
    body[off + 0]  = static_cast<uint8_t>(c.Get("red").As<Napi::Number>().Uint32Value());
    body[off + 1]  = static_cast<uint8_t>(c.Get("green").As<Napi::Number>().Uint32Value());
    body[off + 2]  = static_cast<uint8_t>(c.Get("blue").As<Napi::Number>().Uint32Value());
    body[off + 3]  = 0;
  }
  sendPacket(env, deviceId, CMD_UPDATE_LEDS, body.data(), dataSize);
}

// rgbUpdateSingleLed(deviceId: number, ledId: number, color: { red, green, blue }): void
static void rgbUpdateSingleLed(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (gSocket == -1) throw Napi::Error::New(env, "not connected");
  GET_UINT_32(info, 0, deviceId, uint32_t);
  GET_UINT_32(info, 1, ledId,    uint32_t);
  GET_OBJECT(info,  2, colorObj);
  uint8_t r = static_cast<uint8_t>(colorObj.Get("red").As<Napi::Number>().Uint32Value());
  uint8_t g = static_cast<uint8_t>(colorObj.Get("green").As<Napi::Number>().Uint32Value());
  uint8_t b = static_cast<uint8_t>(colorObj.Get("blue").As<Napi::Number>().Uint32Value());

  // body = uint32_t(ledId) + R G B 0  (no data_size prefix for this command)
  uint8_t body[8];
  memcpy(body, &ledId, 4);
  body[4] = r; body[5] = g; body[6] = b; body[7] = 0;

  sendPacket(env, deviceId, CMD_UPDATE_SINGLE_LED, body, 8);
}

// rgbDisconnect(): void
static void rgbDisconnect(const Napi::CallbackInfo&) {
  if (gSocket != -1) {
    gExpectingDisconnect = true;
    gConnected = false;
    ++gMonitorGen;  // invalidate any running monitor so it doesn't fire the callback
    shutdown(gSocket, SHUT_WR);
    char drain[256];
    while (::recv(gSocket, drain, sizeof(drain), 0) > 0) {}
    close(gSocket);
    gSocket = -1;
  }
}

// ── Module init ────────────────────────────────────────────────────────────────

Napi::Object initOpenRgb(Napi::Env env, Napi::Object exports) {
  exports.Set("rgbConnect",         Napi::Function::New(env, rgbConnect));
  exports.Set("rgbGetDevices",      Napi::Function::New(env, rgbGetDevices));
  exports.Set("rgbSetCustomMode",   Napi::Function::New(env, rgbSetCustomMode));
  exports.Set("rgbUpdateAllLeds",   Napi::Function::New(env, rgbUpdateAllLeds));
  exports.Set("rgbUpdateSingleLed", Napi::Function::New(env, rgbUpdateSingleLed));
  exports.Set("rgbDisconnect",      Napi::Function::New(env, rgbDisconnect));
  exports.Set("rgbRegisterDCEvent", Napi::Function::New(env, rgbRegisterDCEvent));
  return exports;
}
