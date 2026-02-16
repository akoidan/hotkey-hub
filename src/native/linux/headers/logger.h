#pragma once
#include <iostream>
#include <iomanip>
#include <sstream>
#include <chrono>
#include <ctime>

// ANSI color codes matching cli-color
namespace AnsiColor {
  const char *const Reset = "\x1b[0m";
  // Exact matches for cli-color xterm codes
  const char *const Time = "\x1b[38;5;100m"; // clc.xterm(100) - timestamp (dark gold)
  const char *const Label = "\x1b[38;5;2m"; // clc.xterm(2) - label
  const char *const Message = "\x1b[38;5;7m"; // clc.xterm(7) - message
}


static bool logDebug = true;

#define LOG_TIME() if (logDebug) { \
auto now = std::chrono::system_clock::now(); \
auto nowTime = std::chrono::system_clock::to_time_t(now); \
auto ms = std::chrono::duration_cast<std::chrono::milliseconds>(now.time_since_epoch()).count() % 1000; \
std::tm localTm; \
localtime_r(&nowTime, &localTm); \
std::cout << AnsiColor::Time << "[" \
<< std::setfill('0') << std::setw(2) << localTm.tm_hour << ":" \
<< std::setfill('0') << std::setw(2) << localTm.tm_min << ":" \
<< std::setfill('0') << std::setw(2) << localTm.tm_sec << "." \
<< std::setfill('0') << std::setw(3) << ms << "] " \
<< AnsiColor::Reset; \
}

#define LOG(fmt, ...) if (logDebug) { \
LOG_TIME(); \
char buffer[1024]; \
snprintf(buffer, sizeof(buffer), "%s[native] %s" fmt "%s\n", \
AnsiColor::Label, AnsiColor::Message, ##__VA_ARGS__, AnsiColor::Reset); \
std::cout << buffer; \
}