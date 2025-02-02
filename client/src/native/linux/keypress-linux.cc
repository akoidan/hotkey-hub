#include <windows.h>
#include <ctype.h> /* For isupper() */
#include <napi.h>
#include <X11/extensions/XTest.h>
#include <X11/Xlib.h>

#include <stdio.h> /* For fputs() */
#include <stdlib.h> /* For atexit() */
#include <string.h> /* For strdup() */
#include "./key-names.cc"

static Display *mainDisplay = NULL;
static int registered = 0;
static char *displayName = NULL;
static int hasDisplayNameChanged = 0;

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

void XCloseMainDisplay(void) {
	if (mainDisplay != NULL) {
		XCloseDisplay(mainDisplay);
		mainDisplay = NULL;
	}
}

char * getXDisplay(void) {
	return displayName;
}

void setXDisplay(const char *name) {
	displayName = strdup(name);
	hasDisplayNameChanged = 1;
}
#define X_KEY_EVENT(display, key, is_press)                \
	(XTestFakeKeyEvent(display,                        \
			   XKeysymToKeycode(display, key), \
			   is_press, CurrentTime),         \
	 XSync(display, false))

void toggleKeyCode(MMKeyCode code, const bool down, MMKeyFlags flags)
{
	Display *display = XGetMainDisplay();
	const Bool is_press = down ? True : False; /* Just to be safe. */

	if (down)
	{
		/* Parse modifier keys. */
		if (flags & MOD_META)
			X_KEY_EVENT(display, K_META, is_press);
		if (flags & MOD_ALT)
			X_KEY_EVENT(display, K_ALT, is_press);
		if (flags & MOD_CONTROL)
			X_KEY_EVENT(display, K_CONTROL, is_press);
		if (flags & MOD_SHIFT)
			X_KEY_EVENT(display, K_SHIFT, is_press);

		X_KEY_EVENT(display, code, is_press);
	}
	else
	{
		X_KEY_EVENT(display, code, is_press);

		/* Parse modifier keys. */
		if (flags & MOD_META)
			X_KEY_EVENT(display, K_META, is_press);
		if (flags & MOD_ALT)
			X_KEY_EVENT(display, K_ALT, is_press);
		if (flags & MOD_CONTROL)
			X_KEY_EVENT(display, K_CONTROL, is_press);
		if (flags & MOD_SHIFT)
			X_KEY_EVENT(display, K_SHIFT, is_press);
	}
}

void toggleKey(char c, const bool down, unsigned int flags) {
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


void typeString(const char *str) {
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


unsigned int getFlag(napi_env env, napi_value value) {
    unsigned int flags = 0;
    char buffer[32];
    size_t copied;
    napi_get_value_string_utf8(env, value, buffer, sizeof(buffer), &copied);

    if (strcmp(buffer, "alt") == 0) {
        flags = MOD_ALT;
    } else if (strcmp(buffer, "command") == 0 || strcmp(buffer, "win") == 0 || strcmp(buffer, "meta") == 0) {
        flags = MOD_WIN;
    } else if (strcmp(buffer, "control") == 0 || strcmp(buffer, "ctrl") == 0) {
        flags = MOD_CONTROL;
    } else if (strcmp(buffer, "shift") == 0) {
        flags = MOD_SHIFT;
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

        flags = (unsigned int)(flags | f);
    }
    return flags;
}

unsigned int assignKeyCode(const char* keyName) {
    if (strlen(keyName) == 1) {
        return VkKeyScan(keyName[0]);
    }
    unsigned int res = 0;
    KeyNames *kn = key_names;
    while (kn->name) {
        if (_stricmp(keyName, kn->name) == 0) {
            return kn->key;
        }
        kn++;
    }
    return 0;
}

Napi::Value _keyTap(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    unsigned int flags = getAllFlags(env, info[1]);
    std::string keyName = info[0].As<Napi::String>();
    unsigned int key = assignKeyCode(keyName.c_str());
    toggleKeyCode(key, true, flags);
    toggleKeyCode(key, false, flags);
    return env.Undefined();
}

Napi::Value _keyToggle(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    bool down = info[2].As<Napi::Boolean>().Value();

    unsigned int flags = getAllFlags(env, info[1]);

    std::string keyName = info[0].As<Napi::String>();
    unsigned int key = assignKeyCode(keyName.c_str());

    toggleKeyCode(key, down, flags);
    return env.Undefined();
}

Napi::Value _typeString(const Napi::CallbackInfo& info) {
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
