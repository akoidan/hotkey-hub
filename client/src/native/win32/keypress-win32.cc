#include <windows.h>
#include <ctype.h> /* For isupper() */
#include <napi.h>
#include <stdint.h>

/* Simpler uniform distribution hash */
#define DEADBEEF_UNIFORM(X) ((uint32_t)((uint32_t)(X) * 2654435761UL))

/* Sleep for given milliseconds */
void microsleep(double milliseconds) {
    Sleep((DWORD)milliseconds);
}

/* Key code definitions */
enum _MMKeyCode {
    K_NOT_A_KEY = 9999,

    K_BACKSPACE = kVK_Delete,
    K_DELETE = kVK_ForwardDelete,
    K_RETURN = kVK_Return,
    K_TAB = kVK_Tab,
    K_ESCAPE = kVK_Escape,
    K_UP = kVK_UpArrow,
    K_DOWN = kVK_DownArrow,
    K_RIGHT = kVK_RightArrow,
    K_LEFT = kVK_LeftArrow,
    K_HOME = kVK_Home,
    K_END = kVK_End,
    K_PAGEUP = kVK_PageUp,
    K_PAGEDOWN = kVK_PageDown,

    K_A = kVK_ANSI_A,
    K_B = kVK_ANSI_B,
    K_C = kVK_ANSI_C,
    K_D = kVK_ANSI_D,
    K_E = kVK_ANSI_E,
    K_F = kVK_ANSI_F,
    K_G = kVK_ANSI_G,
    K_H = kVK_ANSI_H,
    K_I = kVK_ANSI_I,
    K_J = kVK_ANSI_J,
    K_K = kVK_ANSI_K,
    K_L = kVK_ANSI_L,
    K_M = kVK_ANSI_M,
    K_N = kVK_ANSI_N,
    K_O = kVK_ANSI_O,
    K_P = kVK_ANSI_P,
    K_Q = kVK_ANSI_Q,
    K_R = kVK_ANSI_R,
    K_S = kVK_ANSI_S,
    K_T = kVK_ANSI_T,
    K_U = kVK_ANSI_U,
    K_V = kVK_ANSI_V,
    K_W = kVK_ANSI_W,
    K_X = kVK_ANSI_X,
    K_Y = kVK_ANSI_Y,
    K_Z = kVK_ANSI_Z,

    K_COMMA = kVK_ANSI_Comma,
    K_PERIOD = kVK_ANSI_Period,
    K_SLASH = kVK_ANSI_Slash,

    K_SEMICOLON = kVK_ANSI_Semicolon,
    K_QUOTE = kVK_ANSI_Quote,
    K_LEFTBRACKET = kVK_ANSI_LeftBracket,
    K_RIGHTBRACKET = kVK_ANSI_RightBracket,
    K_BACKSLASH = kVK_ANSI_Backslash,

    K_MINUS = kVK_ANSI_Minus,
    K_EQUAL = kVK_ANSI_Equal,

    K_GRAVE = kVK_ANSI_Grave,

    K_F1 = kVK_F1,
    K_F2 = kVK_F2,
    K_F3 = kVK_F3,
    K_F4 = kVK_F4,
    K_F5 = kVK_F5,
    K_F6 = kVK_F6,
    K_F7 = kVK_F7,
    K_F8 = kVK_F8,
    K_F9 = kVK_F9,
    K_F10 = kVK_F10,
    K_F11 = kVK_F11,
    K_F12 = kVK_F12,
    K_F13 = kVK_F13,
    K_F14 = kVK_F14,
    K_F15 = kVK_F15,
    K_F16 = kVK_F16,
    K_F17 = kVK_F17,
    K_F18 = kVK_F18,
    K_F19 = kVK_F19,
    K_F20 = kVK_F20,
    K_F21 = K_NOT_A_KEY,
    K_F22 = K_NOT_A_KEY,
    K_F23 = K_NOT_A_KEY,
    K_F24 = K_NOT_A_KEY,

    K_META = kVK_Command,
    K_RIGHTMETA = kVK_RightCommand,

    K_CMD = kVK_Command,
    K_RIGHTCMD = kVK_RightCommand,

    K_WIN = K_NOT_A_KEY,
    K_RIGHTWIN = K_NOT_A_KEY,

    K_FUNCTION = kVK_Function,
    K_PAUSE = K_NOT_A_KEY,

    K_ALT = kVK_Option,
    K_RIGHTALT = kVK_RightOption,

    K_CONTROL = kVK_Control,
    K_RIGHTCONTROL = kVK_RightControl,

    K_SHIFT = kVK_Shift,
    K_RIGHTSHIFT = kVK_RightShift,

    K_CAPSLOCK = kVK_CapsLock,
    K_NUMLOCK = K_NOT_A_KEY,
    K_SCROLL_LOCK = K_NOT_A_KEY,

    K_SPACE = kVK_Space,
    K_INSERT = K_NOT_A_KEY,
    K_PRINTSCREEN = K_NOT_A_KEY,
    K_MENU = K_NOT_A_KEY,

    K_ADD = kVK_ANSI_KeypadPlus,
    K_SUBTRACT = kVK_ANSI_KeypadMinus,
    K_DIVIDE = kVK_ANSI_KeypadDivide,
    K_MULTIPLY = kVK_ANSI_KeypadMultiply,
    K_ENTER = kVK_ANSI_KeypadEnter,
    K_CLEAR = kVK_ANSI_KeypadClear,

    K_0 = kVK_ANSI_0,
    K_1 = kVK_ANSI_1,
    K_2 = kVK_ANSI_2,
    K_3 = kVK_ANSI_3,
    K_4 = kVK_ANSI_4,
    K_5 = kVK_ANSI_5,
    K_6 = kVK_ANSI_6,
    K_7 = kVK_ANSI_7,
    K_8 = kVK_ANSI_8,
    K_9 = kVK_ANSI_9,

    K_NUMPAD_0 = kVK_ANSI_Keypad0,
    K_NUMPAD_1 = kVK_ANSI_Keypad1,
    K_NUMPAD_2 = kVK_ANSI_Keypad2,
    K_NUMPAD_3 = kVK_ANSI_Keypad3,
    K_NUMPAD_4 = kVK_ANSI_Keypad4,
    K_NUMPAD_5 = kVK_ANSI_Keypad5,
    K_NUMPAD_6 = kVK_ANSI_Keypad6,
    K_NUMPAD_7 = kVK_ANSI_Keypad7,
    K_NUMPAD_8 = kVK_ANSI_Keypad8,
    K_NUMPAD_9 = kVK_ANSI_Keypad9,
    K_NUMPAD_DECIMAL = kVK_ANSI_KeypadDecimal,

    K_AUDIO_VOLUME_MUTE = 1007,
    K_AUDIO_VOLUME_DOWN = 1001,
    K_AUDIO_VOLUME_UP = 1000,
    K_AUDIO_PLAY = 1016,
    K_AUDIO_STOP = K_NOT_A_KEY,
    K_AUDIO_PAUSE = 1016,
    K_AUDIO_PREV = 1018,
    K_AUDIO_NEXT = 1017,
    K_AUDIO_REWIND = K_NOT_A_KEY,
    K_AUDIO_FORWARD = K_NOT_A_KEY,
    K_AUDIO_REPEAT = K_NOT_A_KEY,
    K_AUDIO_RANDOM = K_NOT_A_KEY,

    K_LIGHTS_MON_UP = 1002,
    K_LIGHTS_MON_DOWN = 1003,
    K_LIGHTS_KBD_TOGGLE = 1023,
    K_LIGHTS_KBD_UP = 1021,
    K_LIGHTS_KBD_DOWN = 1022
};


typedef int MMKeyCode;

enum _MMKeyFlags {
    MOD_NONE = 0,
    /* These are already defined by the Win32 API */
    /* MOD_ALT = 0,
    MOD_CONTROL = 0,
    MOD_SHIFT = 0, */
    MOD_META = MOD_WIN,
    MOD_FN = 0
};

typedef unsigned int MMKeyFlags;

/* Helper function to convert char to keycode */
MMKeyCode keyCodeForChar(const char c)
{
    return VkKeyScan(c);
}

/* Forward declarations */
int GetFlagsFromString(napi_env env, napi_value value, MMKeyFlags *flags);
void typeString(const char *str);
void tapKeyCode(MMKeyCode code, MMKeyFlags flags);
void toggleKeyCode(MMKeyCode code, const bool down, MMKeyFlags flags);

void win32KeyEvent(int key, MMKeyFlags flags)
{
	UINT scan = MapVirtualKey(key & 0xff, MAPVK_VK_TO_VSC);

	/* Set the scan code for extended keys */
	switch (key)
	{
	case VK_RCONTROL:
	case VK_SNAPSHOT: /* Print Screen */
	case VK_RMENU:	  /* Right Alt / Alt Gr */
	case VK_PAUSE:	  /* Pause / Break */
	case VK_HOME:
	case VK_UP:
	case VK_PRIOR: /* Page up */
	case VK_LEFT:
	case VK_RIGHT:
	case VK_END:
	case VK_DOWN:
	case VK_NEXT: /* 'Page Down' */
	case VK_INSERT:
	case VK_DELETE:
	case VK_LWIN:
	case VK_RWIN:
	case VK_APPS: /* Application */
	case VK_VOLUME_MUTE:
	case VK_VOLUME_DOWN:
	case VK_VOLUME_UP:
	case VK_MEDIA_NEXT_TRACK:
	case VK_MEDIA_PREV_TRACK:
	case VK_MEDIA_STOP:
	case VK_MEDIA_PLAY_PAUSE:
	case VK_BROWSER_BACK:
	case VK_BROWSER_FORWARD:
	case VK_BROWSER_REFRESH:
	case VK_BROWSER_STOP:
	case VK_BROWSER_SEARCH:
	case VK_BROWSER_FAVORITES:
	case VK_BROWSER_HOME:
	case VK_LAUNCH_MAIL:
	{
		flags |= KEYEVENTF_EXTENDEDKEY;
		break;
	}
	}

	INPUT keyboardInput;
	keyboardInput.type = INPUT_KEYBOARD;
	keyboardInput.ki.wScan = (WORD)scan;
	keyboardInput.ki.wVk = (WORD)key;
	keyboardInput.ki.dwFlags = KEYEVENTF_SCANCODE | flags;
	keyboardInput.ki.time = 0;
	SendInput(1, &keyboardInput, sizeof(keyboardInput));
}

void toggleKeyCode(MMKeyCode code, const bool down, MMKeyFlags flags)
{
	const DWORD dwFlags = down ? 0 : KEYEVENTF_KEYUP;

	if (down)
	{
		/* Parse modifier keys. */
		if (flags & MOD_META)
			win32KeyEvent(K_META, dwFlags);
		if (flags & MOD_ALT)
			win32KeyEvent(K_ALT, dwFlags);
		if (flags & MOD_CONTROL)
			win32KeyEvent(K_CONTROL, dwFlags);
		if (flags & MOD_SHIFT)
			win32KeyEvent(K_SHIFT, dwFlags);

		win32KeyEvent(code, dwFlags);
	}
	else
	{
		win32KeyEvent(code, dwFlags);

		/* Parse modifier keys. */
		if (flags & MOD_META)
			win32KeyEvent(K_META, dwFlags);
		if (flags & MOD_ALT)
			win32KeyEvent(K_ALT, dwFlags);
		if (flags & MOD_CONTROL)
			win32KeyEvent(K_CONTROL, dwFlags);
		if (flags & MOD_SHIFT)
			win32KeyEvent(K_SHIFT, dwFlags);

	}
}

void tapKeyCode(MMKeyCode code, MMKeyFlags flags)
{
	toggleKeyCode(code, true, flags);
	toggleKeyCode(code, false, flags);
}

void toggleKey(char c, const bool down, MMKeyFlags flags)
{
	MMKeyCode keyCode = keyCodeForChar(c);

	int modifiers = keyCode >> 8; // Pull out modifers.
	if ((modifiers & 1) != 0)
		flags |= MOD_SHIFT; // Update flags from keycode modifiers.
	if ((modifiers & 2) != 0)
		flags |= MOD_CONTROL;
	if ((modifiers & 4) != 0)
		flags |= MOD_ALT;
	keyCode = keyCode & 0xff; // Mask out modifiers.
	toggleKeyCode(keyCode, down, flags);
}

void tapKey(char c, MMKeyFlags flags)
{
	toggleKey(c, true, flags);
	toggleKey(c, false, flags);
}

#define toggleUniKey(c, down) toggleKey(c, down, MOD_NONE)

static void tapUniKey(char c)
{
	toggleUniKey(c, true);
	toggleUniKey(c, false);
}

void typeString(const char *str)
{
	unsigned short c;
	unsigned short c1;
	unsigned short c2;
	unsigned short c3;
	unsigned long n;

	while (*str != '\0')
	{
		c = *str++;

		// warning, the following utf8 decoder
		// doesn't perform validation
		if (c <= 0x7F)
		{
			// 0xxxxxxx one byte
			n = c;
		}
		else if ((c & 0xE0) == 0xC0)
		{
			// 110xxxxx two bytes
			c1 = (*str++) & 0x3F;
			n = ((c & 0x1F) << 6) | c1;
		}
		else if ((c & 0xF0) == 0xE0)
		{
			// 1110xxxx three bytes
			c1 = (*str++) & 0x3F;
			c2 = (*str++) & 0x3F;
			n = ((c & 0x0F) << 12) | (c1 << 6) | c2;
		}
		else if ((c & 0xF8) == 0xF0)
		{
			// 11110xxx four bytes
			c1 = (*str++) & 0x3F;
			c2 = (*str++) & 0x3F;
			c3 = (*str++) & 0x3F;
			n = ((c & 0x07) << 18) | (c1 << 12) | (c2 << 6) | c3;
		}
		else
			continue; /* ignore invalid UTF-8 */

		toggleUniKey((char)n, true);
		toggleUniKey((char)n, false);
	}
}

void typeStringDelayed(const char *str, const unsigned cpm)
{
	/* Characters per second */
	const double cps = (double)cpm / 60.0;

	/* Average milli-seconds per character */
	const double mspc = (cps == 0.0) ? 0.0 : 1000.0 / cps;

	while (*str != '\0')
	{
		tapUniKey(*str++);
		microsleep(mspc + (DEADBEEF_UNIFORM(1) % 63)); /* Random delay between 0-62ms */
	}
}

typedef struct {
    const char* name;
    MMKeyCode key;
} KeyNames;

static KeyNames key_names[] =
        {
                {"backspace",         K_BACKSPACE},
                {"delete",            K_DELETE},
                {"return",            K_RETURN},
                {"tab",               K_TAB},
                {"escape",            K_ESCAPE},

                {"up",                K_UP},
                {"down",              K_DOWN},
                {"right",             K_RIGHT},
                {"left",              K_LEFT},

                {"home",              K_HOME},
                {"end",               K_END},
                {"pageup",            K_PAGEUP},
                {"pagedown",          K_PAGEDOWN},

                {"0",                 K_0},
                {"1",                 K_1},
                {"2",                 K_2},
                {"3",                 K_3},
                {"4",                 K_4},
                {"5",                 K_5},
                {"6",                 K_6},
                {"7",                 K_7},
                {"8",                 K_8},
                {"9",                 K_9},

                {"a",                 K_A},
                {"b",                 K_B},
                {"c",                 K_C},
                {"d",                 K_D},
                {"e",                 K_E},
                {"f",                 K_F},
                {"g",                 K_G},
                {"h",                 K_H},
                {"i",                 K_I},
                {"j",                 K_J},
                {"k",                 K_K},
                {"l",                 K_L},
                {"m",                 K_M},
                {"n",                 K_N},
                {"o",                 K_O},
                {"p",                 K_P},
                {"q",                 K_Q},
                {"r",                 K_R},
                {"s",                 K_S},
                {"t",                 K_T},
                {"u",                 K_U},
                {"v",                 K_V},
                {"w",                 K_W},
                {"x",                 K_X},
                {"y",                 K_Y},
                {"z",                 K_Z},

                {",",                 K_COMMA},
                {".",                 K_PERIOD},
                {"/",                 K_SLASH},

                {";",                 K_SEMICOLON},
                {"'",                 K_QUOTE},
                {"[",                 K_LEFTBRACKET},
                {"]",                 K_RIGHTBRACKET},
                {"\\",                K_BACKSLASH},

                {"-",                 K_MINUS},
                {"=",                 K_EQUAL},

                {"`",                 K_GRAVE},

                {"f1",                K_F1},
                {"f2",                K_F2},
                {"f3",                K_F3},
                {"f4",                K_F4},
                {"f5",                K_F5},
                {"f6",                K_F6},
                {"f7",                K_F7},
                {"f8",                K_F8},
                {"f9",                K_F9},
                {"f10",               K_F10},
                {"f11",               K_F11},
                {"f12",               K_F12},
                {"f13",               K_F13},
                {"f14",               K_F14},
                {"f15",               K_F15},
                {"f16",               K_F16},
                {"f17",               K_F17},
                {"f18",               K_F18},
                {"f19",               K_F19},
                {"f20",               K_F20},
                {"f21",               K_F21},
                {"f22",               K_F22},
                {"f23",               K_F23},
                {"f24",               K_F24},

                {"meta",              K_META},
                {"right_meta",        K_RIGHTMETA},

                {"cmd",               K_CMD},
                {"right_cmd",         K_RIGHTCMD},

                {"win",               K_WIN},
                {"right_win",         K_RIGHTWIN},

                {"alt",               K_ALT},
                {"right_alt",         K_RIGHTALT},

                {"control",           K_CONTROL},
                {"right_control",     K_RIGHTCONTROL},

                {"shift",             K_SHIFT},
                {"right_shift",       K_RIGHTSHIFT},

                {"space",             K_SPACE},

                {"printscreen",       K_PRINTSCREEN},
                {"insert",            K_INSERT},
                {"menu",              K_MENU},
                {"fn",                K_FUNCTION},
                {"pause",             K_PAUSE},

                {"caps_lock",         K_CAPSLOCK},
                {"num_lock",          K_NUMLOCK},
                {"scroll_lock",       K_SCROLL_LOCK},

                {"audio_mute",        K_AUDIO_VOLUME_MUTE},
                {"audio_vol_down",    K_AUDIO_VOLUME_DOWN},
                {"audio_vol_up",      K_AUDIO_VOLUME_UP},
                {"audio_play",        K_AUDIO_PLAY},
                {"audio_stop",        K_AUDIO_STOP},
                {"audio_pause",       K_AUDIO_PAUSE},
                {"audio_prev",        K_AUDIO_PREV},
                {"audio_next",        K_AUDIO_NEXT},
                {"audio_rewind",      K_AUDIO_REWIND},
                {"audio_forward",     K_AUDIO_FORWARD},
                {"audio_repeat",      K_AUDIO_REPEAT},
                {"audio_random",      K_AUDIO_RANDOM},

                {"numpad_0",          K_NUMPAD_0},
                {"numpad_1",          K_NUMPAD_1},
                {"numpad_2",          K_NUMPAD_2},
                {"numpad_3",          K_NUMPAD_3},
                {"numpad_4",          K_NUMPAD_4},
                {"numpad_5",          K_NUMPAD_5},
                {"numpad_6",          K_NUMPAD_6},
                {"numpad_7",          K_NUMPAD_7},
                {"numpad_8",          K_NUMPAD_8},
                {"numpad_9",          K_NUMPAD_9},
                {"numpad_decimal",    K_NUMPAD_DECIMAL},
                {"enter",             K_ENTER},
                {"clear",             K_CLEAR},

                {"add",               K_ADD},
                {"subtract",          K_SUBTRACT},
                {"multiply",          K_MULTIPLY},
                {"divide",            K_DIVIDE},

                {"lights_mon_up",     K_LIGHTS_MON_UP},
                {"lights_mon_down",   K_LIGHTS_MON_DOWN},
                {"lights_kbd_toggle", K_LIGHTS_KBD_TOGGLE},
                {"lights_kbd_up",     K_LIGHTS_KBD_UP},
                {"lights_kbd_down",   K_LIGHTS_KBD_DOWN},
                {NULL,                K_NOT_A_KEY} /* end marker */
        };

int GetFlagsFromString(napi_env env, napi_value value, MMKeyFlags *flags) {
    if (!flags) return -1;

    char buffer[32];
    size_t copied;
    napi_status status = napi_get_value_string_utf8(env, value, buffer, sizeof(buffer), &copied);
    if (status != napi_ok) return -2;

    if (strcmp(buffer, "alt") == 0) {
        *flags = MOD_ALT;
    } else if (strcmp(buffer, "command") == 0 || strcmp(buffer, "win") == 0 || strcmp(buffer, "meta") == 0) {
        *flags = MOD_META;
    } else if (strcmp(buffer, "control") == 0 || strcmp(buffer, "ctrl") == 0) {
        *flags = MOD_CONTROL;
    } else if (strcmp(buffer, "shift") == 0) {
        *flags = MOD_SHIFT;
    } else if (strcmp(buffer, "none") == 0) {
        *flags = MOD_NONE;
    } else {
        return -2;
    }

    return 0;
}

int GetFlagsFromValue(napi_env env, napi_value value, MMKeyFlags *flags) {
    if (!flags) {
        return -1;
    }

    bool is_array;
    napi_status status = napi_is_array(env, value, &is_array);
    if (status != napi_ok) {
        return -1;
    }

    if (is_array) {
        uint32_t length;
        status = napi_get_array_length(env, value, &length);
        if (status != napi_ok) {
            return -1;
        }

        for (uint32_t i = 0; i < length; i++) {
            napi_value element;
            status = napi_get_element(env, value, i, &element);
            if (status != napi_ok) {
                return -2;
            }

            MMKeyFlags f = MOD_NONE;
            const int rv = GetFlagsFromString(env, element, &f);
            if (rv) {
                return rv;
            }

            *flags = (MMKeyFlags)(*flags | f);
        }
        return 0;
    }

    return GetFlagsFromString(env, value, flags);
}

int CheckKeyCodes(const char* keyName, MMKeyCode *key) {
    if (!key || !keyName) return -1;

    if (strlen(keyName) == 1) {
        *key = keyCodeForChar(keyName[0]);
        return 0;
    }

    *key = K_NOT_A_KEY;
    KeyNames *kn = key_names;
    while (kn->name) {
        if (_stricmp(keyName, kn->name) == 0) {
            *key = kn->key;
            break;
        }
        kn++;
    }

    if (*key == K_NOT_A_KEY) {
        return -2;
    }

    return 0;
}

Napi::Value _keyTap(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || info.Length() > 2) {
        Napi::TypeError::New(env, "Invalid number of arguments").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    MMKeyFlags flags = MOD_NONE;
    MMKeyCode key;

    std::string keyName = info[0].As<Napi::String>();

    if (info.Length() == 2) {
        int rv = GetFlagsFromValue(env, info[1], &flags);
        if (rv == -1) {
            Napi::TypeError::New(env, "Null pointer in key flag").ThrowAsJavaScriptException();
            return env.Undefined();
        } else if (rv == -2) {
            Napi::TypeError::New(env, "Invalid key flag specified").ThrowAsJavaScriptException();
            return env.Undefined();
        }
    }

    int rv = CheckKeyCodes(keyName.c_str(), &key);
    if (rv == -1) {
        Napi::TypeError::New(env, "Null pointer in key code").ThrowAsJavaScriptException();
        return env.Undefined();
    } else if (rv == -2) {
        Napi::TypeError::New(env, "Invalid key code specified").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    tapKeyCode(key, flags);
    return Napi::Number::New(env, 1);
}

Napi::Value _keyToggle(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || info.Length() > 3) {
        Napi::TypeError::New(env, "Invalid number of arguments").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    MMKeyFlags flags = MOD_NONE;
    bool down = false;

    /* Get key modifier. */
    if (info.Length() > 1) {
        int rv = GetFlagsFromValue(env, info[1], &flags);
        if (rv) {
            Napi::TypeError::New(env, "Failed to parse key modifier").ThrowAsJavaScriptException();
            return env.Undefined();
        }
    }

    /* Get key state. */
    if (info.Length() > 2) {
        if (info[2].IsString()) {
            std::string state = info[2].As<Napi::String>();
            if (state == "down") {
                down = true;
            } else if (state == "up") {
                down = false;
            } else {
                Napi::TypeError::New(env, "Invalid key state specified").ThrowAsJavaScriptException();
                return env.Undefined();
            }
        } else {
            Napi::TypeError::New(env, "Invalid key state specified").ThrowAsJavaScriptException();
            return env.Undefined();
        }
    }

    MMKeyCode key;
    std::string keyName = info[0].As<Napi::String>();
    int rv = CheckKeyCodes(keyName.c_str(), &key);
    if (rv) {
        Napi::TypeError::New(env, "Failed to parse key code").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    toggleKeyCode(key, down, flags);
    return Napi::Number::New(env, 0);
}

Napi::Value _typeString(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1) {
        Napi::TypeError::New(env, "Invalid number of arguments").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    std::string str = info[0].As<Napi::String>();
    typeString(str.c_str());

    return Napi::Number::New(env, 0);
}

Napi::Object keyboard_init(Napi::Env env, Napi::Object exports) {
    exports.Set(Napi::String::New(env, "keyTap"), Napi::Function::New(env, _keyTap));
    exports.Set(Napi::String::New(env, "keyToggle"), Napi::Function::New(env, _keyToggle));
    exports.Set(Napi::String::New(env, "typeString"), Napi::Function::New(env, _typeString));
    return exports;
}
