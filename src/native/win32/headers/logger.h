#pragma once
#include <iostream>
#include <iomanip>
#include <sstream>
#include <chrono>
#include <windows.h>

#define LOG_TIME() do { \
    auto now = std::chrono::system_clock::now(); \
    auto now_time = std::chrono::system_clock::to_time_t(now); \
    auto ms = std::chrono::duration_cast<std::chrono::milliseconds>(now.time_since_epoch()).count() % 1000; \
    std::tm local_tm; \
    localtime_s(&local_tm, &now_time); \
    SetConsoleTextAttribute(GetStdHandle(STD_OUTPUT_HANDLE), FOREGROUND_RED | FOREGROUND_GREEN | FOREGROUND_INTENSITY); \
    std::cout << "[" \
              << std::setfill('0') << std::setw(2) << local_tm.tm_hour << ":" \
              << std::setfill('0') << std::setw(2) << local_tm.tm_min << ":" \
              << std::setfill('0') << std::setw(2) << local_tm.tm_sec << "." \
              << std::setfill('0') << std::setw(3) << ms << "] "; \
    SetConsoleTextAttribute(GetStdHandle(STD_OUTPUT_HANDLE), FOREGROUND_RED | FOREGROUND_GREEN | FOREGROUND_BLUE); \
} while(0)

#define LOG_MAIN(msg) do { \
    LOG_TIME(); \
    SetConsoleTextAttribute(GetStdHandle(STD_OUTPUT_HANDLE), FOREGROUND_BLUE | FOREGROUND_GREEN | FOREGROUND_INTENSITY); \
    std::cout << "init: "; \
    SetConsoleTextAttribute(GetStdHandle(STD_OUTPUT_HANDLE), FOREGROUND_INTENSITY); \
    std::cout << msg << std::endl; \
    SetConsoleTextAttribute(GetStdHandle(STD_OUTPUT_HANDLE), FOREGROUND_RED | FOREGROUND_GREEN | FOREGROUND_BLUE); \
} while(0)

#define LOG_THREAD(msg) do { \
    LOG_TIME(); \
    SetConsoleTextAttribute(GetStdHandle(STD_OUTPUT_HANDLE), FOREGROUND_BLUE | FOREGROUND_GREEN | FOREGROUND_INTENSITY); \
    std::cout << "Thread: "; \
    SetConsoleTextAttribute(GetStdHandle(STD_OUTPUT_HANDLE), FOREGROUND_INTENSITY); \
    std::cout << msg << std::endl; \
    SetConsoleTextAttribute(GetStdHandle(STD_OUTPUT_HANDLE), FOREGROUND_RED | FOREGROUND_GREEN | FOREGROUND_BLUE); \
} while(0)
