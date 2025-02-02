#include <ctype.h> /* For isupper() */
#include <napi.h>
#include <X11/extensions/XTest.h>
#include <X11/Xlib.h>

#include <stdio.h> /* For fputs() */
#include <stdlib.h> /* For atexit() */
#include <string.h> /* For strdup() */
#include <iostream>
#include <map>
#include "./key-names.cc"

static Display *mainDisplay = NULL;
static int registered = 0;
static char *displayName = NULL;
static int hasDisplayNameChanged = 0;

void XCloseMainDisplay(void) {
    if (mainDisplay != NULL) {
        XCloseDisplay(mainDisplay);
        mainDisplay = NULL;
    }
}

Display *XGetMainDisplay(void) {
    /* Close the display if displayName has changed */
    if (hasDisplayNameChanged) {
        XCloseMainDisplay();
        hasDisplayNameChanged = 0;
    }

    if (mainDisplay == NULL) {
        /* First try the user set displayName */
        mainDisplay = XOpenDisplay(displayName);

        if (mainDisplay == NULL) {
            fputs("Could not open main display\n", stderr);
        } else if (!registered) {
            atexit(&XCloseMainDisplay);
            registered = 1;
        }
    }

    return mainDisplay;
}


#define X_KEY_EVENT(display, key, is_press)                \
    (XTestFakeKeyEvent(display, XKeysymToKeycode(display, key), is_press, CurrentTime), XSync(display, false))

void toggleKeyCode(KeySym code, const bool down, unsigned int flags) {
    Display *display = XGetMainDisplay();
    const Bool is_press = down ? True : False; /* Just to be safe. */
    if (!down) {
        X_KEY_EVENT(display, code, is_press);
    }

    if (flags & Mod4Mask)
        X_KEY_EVENT(display, XK_Super_L, is_press);
    if (flags & Mod1Mask)
        X_KEY_EVENT(display, XK_Alt_L, is_press);
    if (flags & ControlMask)
        X_KEY_EVENT(display, XK_Control_L, is_press);
    if (flags & ShiftMask)
        X_KEY_EVENT(display, XK_Shift_L, is_press);

    if (down) {
        X_KEY_EVENT(display, code, is_press);
    }

}

static std::map<char, KeySym> XSpecialCharacterMap = {
        {'[', XK_bracketleft},
        {']', XK_bracketright},
        {',', XK_comma},
        {'-', XK_minus},
        {'.', XK_period},
        {'=', XK_equal},
        {';', XK_semicolon},
        {'\\', XK_backslash},
        {'`', XK_grave},
        {'/', XK_slash},
        {' ', XK_space},
        {'\t', XK_Tab},
        {'\n', XK_Return}
};

static std::map<char, KeySym> XShiftRequiredMap = {
        {'~', XK_asciitilde},
        {'_', XK_underscore},
        {'!', XK_exclam},
        {'@', XK_at},
        {'#', XK_numbersign},
        {'$', XK_dollar},
        {'%', XK_percent},
        {'^', XK_asciicircum},
        {'&', XK_ampersand},
        {'*', XK_asterisk},
        {'(', XK_parenleft},
        {')', XK_parenright},
        {'+', XK_plus},
        {'{', XK_braceleft},
        {'}', XK_braceright},
        {'|', XK_bar},
        {':', XK_colon},
        {'"', XK_quotedbl},
        {'<', XK_less},
        {'>', XK_greater},
        {'?', XK_question}
};

KeySym keyCodeForChar(const char c) {
    KeySym code;

    char buf[2];
    buf[0] = c;
    buf[1] = '\0';

    code = XStringToKeysym(buf);
    if (code == NoSymbol) {
        auto it = XSpecialCharacterMap.find(c);
        if (it != XSpecialCharacterMap.end()) {
            code = it->second;
        } else {
            auto shiftIt = XShiftRequiredMap.find(c);
            if (shiftIt != XShiftRequiredMap.end()) {
                code = shiftIt->second;
            }
        }
    }

    return code;
}

void toggleKey(char c, const bool down, unsigned int flags) {
    KeySym keyCode = keyCodeForChar(c);
    if (isupper(c) || XShiftRequiredMap.find(c) != XShiftRequiredMap.end()) {
        flags |= ShiftMask;
    }
    toggleKeyCode(keyCode, down, flags);
}


void typeString(const char *str) {
    unsigned short c;
    unsigned short c1;
    unsigned short c2;
    unsigned short c3;
    unsigned long n;

    while (*str != '\0') {
        c = *str++;

        // warning, the following utf8 decoder
        // doesn't perform validation
        if (c <= 0x7F) {
            // 0xxxxxxx one byte
            n = c;
        } else if ((c & 0xE0) == 0xC0) {
            // 110xxxxx two bytes
            c1 = (*str++) & 0x3F;
            n = ((c & 0x1F) << 6) | c1;
        } else if ((c & 0xF0) == 0xE0) {
            // 1110xxxx three bytes
            c1 = (*str++) & 0x3F;
            c2 = (*str++) & 0x3F;
            n = ((c & 0x0F) << 12) | (c1 << 6) | c2;
        } else if ((c & 0xF8) == 0xF0) {
            // 11110xxx four bytes
            c1 = (*str++) & 0x3F;
            c2 = (*str++) & 0x3F;
            c3 = (*str++) & 0x3F;
            n = ((c & 0x07) << 18) | (c1 << 12) | (c2 << 6) | c3;
        } else
            continue; /* ignore invalid UTF-8 */

        toggleKey((char) n, true, 0);
        toggleKey((char) n, false, 0);
    }
}


unsigned int getFlag(napi_env env, napi_value value) {
    unsigned int flags = 0;
    char buffer[32];
    size_t copied;
    napi_get_value_string_utf8(env, value, buffer, sizeof(buffer), &copied);

    if (strcmp(buffer, "alt") == 0) {
        flags = Mod1Mask;
    } else if (strcmp(buffer, "command") == 0 || strcmp(buffer, "win") == 0 || strcmp(buffer, "meta") == 0) {
        flags = Mod4Mask;
    } else if (strcmp(buffer, "control") == 0 || strcmp(buffer, "ctrl") == 0) {
        flags = ControlMask;
    } else if (strcmp(buffer, "shift") == 0) {
        flags = ShiftMask;
    } else if (strcmp(buffer, "none") == 0) {
        flags = 0;
    }

    return flags;
}

unsigned int getAllFlags(napi_env env, napi_value value) {
    bool is_array;
    unsigned int flags = 0;

    uint32_t length;
    napi_get_array_length(env, value, &length);

    for (uint32_t i = 0; i < length; i++) {
        napi_value element;
        napi_get_element(env, value, i, &element);
        unsigned int f = getFlag(env, element);

        flags = (unsigned int) (flags | f);
    }
    return flags;
}

unsigned int assignKeyCode(std::string &keyName) {
    if (keyName.length() == 1) {
        return keyCodeForChar(keyName[0]);
    }
    unsigned int res = 0;
    KeyNames *kn = key_names;
    while (kn->name) {
        if (keyName.compare((kn->name)) == 0) {
            return kn->key;
        }
        kn++;
    }
    return 0;
}

Napi::Value _keyTap(const Napi::CallbackInfo &info) {
    Napi::Env env = info.Env();
    unsigned int flags = getAllFlags(env, info[1]);
    std::string keyName = info[0].As<Napi::String>();
    unsigned int key = assignKeyCode(keyName);
    toggleKeyCode(key, true, flags);
    toggleKeyCode(key, false, flags);
    return env.Undefined();
}

Napi::Value _keyToggle(const Napi::CallbackInfo &info) {
    Napi::Env env = info.Env();

    bool down = info[2].As<Napi::Boolean>().Value();

    unsigned int flags = getAllFlags(env, info[1]);

    std::string keyName = info[0].As<Napi::String>();
    unsigned int key = assignKeyCode(keyName);

    toggleKeyCode(key, down, flags);
    return env.Undefined();
}

Napi::Value _typeString(const Napi::CallbackInfo &info) {
    Napi::Env env = info.Env();

    std::string str = info[0].As<Napi::String>();
    typeString(str.c_str());

    return env.Undefined();
}

Napi::Object keyboard_init(Napi::Env env, Napi::Object exports) {
    exports.Set(Napi::String::New(env, "keyTap"), Napi::Function::New(env, _keyTap));
    exports.Set(Napi::String::New(env, "keyToggle"), Napi::Function::New(env, _keyToggle));
    exports.Set(Napi::String::New(env, "typeString"), Napi::Function::New(env, _typeString));
    return exports;
}
