#include <windows.h>
#include <ctype.h> /* For isupper() */

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
		microsleep(mspc + (DEADBEEF_UNIFORM(0.0, 62.5)));
	}
}

int GetFlagsFromValue(Napi::Value value, MMKeyFlags *flags) {
    if (!flags)
        return -1;

    //Optionally allow an array of flag strings to be passed.
    if (value.IsArray()) {
        Napi::Array a = value.As<Napi::Array>();
        for (uint32_t i = 0; i < a.Length(); ++i) {
            Napi::Value v = a.Get(i);
            if (!v.IsString())
                return -2;

            MMKeyFlags f = MOD_NONE;
            const int rv = GetFlagsFromString(v, &f);
            if (rv)
                return rv;

            *flags = (MMKeyFlags) (*flags | f);
        }
        return 0;
    }

    //If it's not an array, it should be a single string value.
    return GetFlagsFromString(value, flags);
}

Napi::Number _keyTap(const Napi::CallbackInfo &info) {
    Napi::Env env = info.Env();

    MMKeyFlags flags = MOD_NONE;
    MMKeyCode key;

    std::string keyName = info[0].As<Napi::String>();

    switch (info.Length()) {
        case 2:
            switch (GetFlagsFromValue(info[1], &flags)) {
                case -1:
                    throw Napi::Error::New(env, "Null pointer in key flag.");
                    break;
                case -2:
                    throw Napi::Error::New(env, "Invalid key flag specified.");
                    break;
            }
            break;
        case 1:
            break;
        default:
            throw Napi::Error::New(env, "Invalid number of arguments.");
    }

    switch (CheckKeyCodes(keyName, &key)) {
        case -1:
            throw Napi::Error::New(env, "Null pointer in key code.");
            break;
        case -2:
            throw Napi::Error::New(env, "Invalid key code specified.");
            break;
        default:
            tapKeyCode(key, flags);
    }

    return Napi::Number::New(env, 1);
}

Napi::Number _keyToggle(const Napi::CallbackInfo &info) {
    Napi::Env env = info.Env();

    MMKeyFlags flags = MOD_NONE;
    MMKeyCode key;

    bool down = false;

    //Get arguments from JavaScript.
    std::string keyName = info[0].As<Napi::String>();

    //Check and confirm number of arguments.
    switch (info.Length()) {
        case 3:
            //Get key modifier.
            switch (GetFlagsFromValue(info[2], &flags)) {
                case -1:
                    throw Napi::Error::New(env, "Null pointer in key flag.");
                    break;
                case -2:
                    throw Napi::Error::New(env, "Invalid key flag specified.");
                    break;
            }
            break;
        case 2:
            break;
        default:
            throw Napi::Error::New(env, "Invalid number of arguments.");
    }

    //Get down value if provided.
    if (info.Length() > 1) {
        std::string directionString = info[1].As<Napi::String>();

        if (directionString.compare("down") == 0) {
            down = true;
        } else if (directionString.compare("up") == 0) {
            down = false;
        } else {
            throw Napi::Error::New(env, "Invalid key state specified.");
        }
    }

    //Get the acutal key.
    switch (CheckKeyCodes(keyName, &key)) {
        case -1:
            throw Napi::Error::New(env, "Null pointer in key code.");
            break;
        case -2:
            throw Napi::Error::New(env, "Invalid key code specified.");
            break;
        default:
            toggleKeyCode(key, down, flags);
    }

    return Napi::Number::New(env, 1);
}


int CheckKeyCodes(std::string &keyName, MMKeyCode *key) {
    if (!key)
        return -1;

    if (keyName.length() == 1) {
        *key = keyCodeForChar(*keyName.c_str());
        return 0;
    }

    *key = K_NOT_A_KEY;

    KeyNames *kn = key_names;
    while (kn->name) {
        if (keyName.compare(kn->name) == 0) {
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

Napi::Number _typeString(const Napi::CallbackInfo &info) {
    Napi::Env env = info.Env();

    std::string stringToType = info[0].As<Napi::String>();

    typeString(stringToType.c_str());

    return Napi::Number::New(env, 1);
}


Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set(Napi::String::New(env, "keyTap"), Napi::Function::New(env, _keyTap));
    exports.Set(Napi::String::New(env, "keyToggle"), Napi::Function::New(env, _keyToggle));
    exports.Set(Napi::String::New(env, "typeString"), Napi::Function::New(env, _typeString));

    return exports;
}

NODE_API_MODULE(libnut, Init
);
