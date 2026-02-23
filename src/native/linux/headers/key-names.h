#pragma once

#include <X11/Xutil.h>
#include <map>

typedef struct {
  const char *name;
  KeySym key;
} KeyNames;

extern KeyNames keyNames[];
extern std::map<char, KeySym> xShiftRequiredMap;
extern std::map<char, KeySym> xSpecialCharacterMap;
