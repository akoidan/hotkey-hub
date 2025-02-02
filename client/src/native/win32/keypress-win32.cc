#include <windows.h>
#include <ctype.h> /* For isupper() */
#include <napi.h>
#include <stdint.h>
#include "./key-names.cc"

/* Forward declarations */
int GetFlagsFromString(napi_env env, napi_value value, unsigned int *flags);
void typeString(const char *str);
void tapKeyCode(unsigned int code, unsigned int flags);
void toggleKeyCode(unsigned int code, const bool down, unsigned int flags);

void win32KeyEvent(int key, unsigned int flags)
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

void toggleKeyCode(unsigned int code, const bool down, unsigned int flags)
{
	const DWORD dwFlags = down ? 0 : KEYEVENTF_KEYUP;

	if (down)
	{
		/* Parse modifier keys. */
		if (flags & MOD_WIN)
			win32KeyEvent(VK_LWIN, dwFlags);
		if (flags & MOD_ALT)
			win32KeyEvent(VK_LMENU, dwFlags);
		if (flags & MOD_CONTROL)
			win32KeyEvent(VK_LCONTROL, dwFlags);
		if (flags & MOD_SHIFT)
			win32KeyEvent(VK_LSHIFT, dwFlags);

		win32KeyEvent(code, dwFlags);
	}
	else
	{
		win32KeyEvent(code, dwFlags);

		/* Parse modifier keys. */
		if (flags & MOD_WIN)
			win32KeyEvent(VK_LWIN, dwFlags);
		if (flags & MOD_ALT)
			win32KeyEvent(VK_LMENU, dwFlags);
		if (flags & MOD_CONTROL)
			win32KeyEvent(VK_LCONTROL, dwFlags);
		if (flags & MOD_SHIFT)
			win32KeyEvent(VK_LSHIFT, dwFlags);

	}
}

void tapKeyCode(unsigned int code, unsigned int flags)
{
	toggleKeyCode(code, true, flags);
	toggleKeyCode(code, false, flags);
}

void toggleKey(char c, const bool down, unsigned int flags)
{
	unsigned int keyCode = VkKeyScan(c);

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

        toggleKey((char)n, true, 0);
        toggleKey((char)n, false, 0);
	}
}


int GetFlagsFromString(napi_env env, napi_value value, unsigned int *flags) {
    if (!flags) return -1;

    char buffer[32];
    size_t copied;
    napi_status status = napi_get_value_string_utf8(env, value, buffer, sizeof(buffer), &copied);
    if (status != napi_ok) return -2;

    if (strcmp(buffer, "alt") == 0) {
        *flags = MOD_ALT;
    } else if (strcmp(buffer, "command") == 0 || strcmp(buffer, "win") == 0 || strcmp(buffer, "meta") == 0) {
        *flags = MOD_WIN;
    } else if (strcmp(buffer, "control") == 0 || strcmp(buffer, "ctrl") == 0) {
        *flags = MOD_CONTROL;
    } else if (strcmp(buffer, "shift") == 0) {
        *flags = MOD_SHIFT;
    } else if (strcmp(buffer, "none") == 0) {
        *flags = 0;
    } else {
        return -2;
    }

    return 0;
}

int GetFlagsFromValue(napi_env env, napi_value value, unsigned int *flags) {
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

            unsigned int f = 0;
            const int rv = GetFlagsFromString(env, element, &f);
            if (rv) {
                return rv;
            }

            *flags = (unsigned int)(*flags | f);
        }
        return 0;
    }

    return GetFlagsFromString(env, value, flags);
}

int CheckKeyCodes(const char* keyName, unsigned int *key) {
    if (!key || !keyName) return -1;

    if (strlen(keyName) == 1) {
        *key = VkKeyScan(keyName[0]);
        return 0;
    }

    *key = 0;
    KeyNames *kn = key_names;
    while (kn->name) {
        if (_stricmp(keyName, kn->name) == 0) {
            *key = kn->key;
            break;
        }
        kn++;
    }

    if (*key == 0) {
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

    unsigned int flags = 0;
    unsigned int key;

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

    unsigned int flags = 0;
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

    unsigned int key;
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
