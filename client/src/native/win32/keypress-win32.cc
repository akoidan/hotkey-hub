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
    K_BACKSPACE = VK_BACK,
    K_DELETE = VK_DELETE,
    K_RETURN = VK_RETURN,
    K_TAB = VK_TAB,
    K_ESCAPE = VK_ESCAPE,
    K_UP = VK_UP,
    K_DOWN = VK_DOWN,
    K_RIGHT = VK_RIGHT,
    K_LEFT = VK_LEFT,
    K_HOME = VK_HOME,
    K_END = VK_END,
    K_PAGEUP = VK_PRIOR,
    K_PAGEDOWN = VK_NEXT,
    K_F1 = VK_F1,
    K_F2 = VK_F2,
    K_F3 = VK_F3,
    K_F4 = VK_F4,
    K_F5 = VK_F5,
    K_F6 = VK_F6,
    K_F7 = VK_F7,
    K_F8 = VK_F8,
    K_F9 = VK_F9,
    K_F10 = VK_F10,
    K_F11 = VK_F11,
    K_F12 = VK_F12,
    K_F13 = VK_F13,
    K_F14 = VK_F14,
    K_F15 = VK_F15,
    K_F16 = VK_F16,
    K_F17 = VK_F17,
    K_F18 = VK_F18,
    K_F19 = VK_F19,
    K_F20 = VK_F20,
    K_F21 = VK_F21,
    K_F22 = VK_F22,
    K_F23 = VK_F23,
    K_F24 = VK_F24,

    /* Modifier keys */
    K_ALT = VK_MENU,
    K_CONTROL = VK_CONTROL,
    K_SHIFT = VK_SHIFT,
    K_META = VK_LWIN
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

static KeyNames key_names[] = {
    {"backspace", K_BACKSPACE},
    {"delete", K_DELETE},
    {"enter", K_RETURN},
    {"tab", K_TAB},
    {"escape", K_ESCAPE},
    {"up", K_UP},
    {"down", K_DOWN},
    {"right", K_RIGHT},
    {"left", K_LEFT},
    {"home", K_HOME},
    {"end", K_END},
    {"pageup", K_PAGEUP},
    {"pagedown", K_PAGEDOWN},
    {"f1", K_F1},
    {"f2", K_F2},
    {"f3", K_F3},
    {"f4", K_F4},
    {"f5", K_F5},
    {"f6", K_F6},
    {"f7", K_F7},
    {"f8", K_F8},
    {"f9", K_F9},
    {"f10", K_F10},
    {"f11", K_F11},
    {"f12", K_F12},
    {"f13", K_F13},
    {"f14", K_F14},
    {"f15", K_F15},
    {"f16", K_F16},
    {"f17", K_F17},
    {"f18", K_F18},
    {"f19", K_F19},
    {"f20", K_F20},
    {"f21", K_F21},
    {"f22", K_F22},
    {"f23", K_F23},
    {"f24", K_F24},
    {NULL, K_NOT_A_KEY} /* End marker */
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
