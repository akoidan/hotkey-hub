[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/akoidan/hotkey-hub/blob/main/LICENSE) [![Coverage](https://coveralls.io/repos/github/akoidan/hotkey-hub/badge.svg?branch=main)](https://coveralls.io/github/akoidan/hotkey-hub?branch=main) [![Build Status](https://github.com/akoidan/hotkey-hub/actions/workflows/release.yaml/badge.svg)](https://github.com/akoidan/hotkey-hub/actions/workflows/release.yaml)

# Hotkey Hub

Hotkey Hub is a powerful remote PC control tool that lets you bind hotkeys on one computer to trigger actions on another computer over HTTP. For example, you can press `alt+1` on your PC to trigger an `F1` keystroke on a remote PC.

## Features

- **Keyboard Control**: Bind local hotkeys to remote keystrokes
- **Mouse Control**: Move cursor and trigger clicks remotely
- **Process Management**: Run or kill executable files
- **Window Management**: Control window focus, size, and position

## Project Structure

The project needs these configuration and security files to work:

### Required Files
- `%APPDATA%/hotkey-hub/config.jsonc`: Main configuration file that defines your hotkey bindings and actions. Schema is defined in `json-schema.json`. Check [github-pages](https://akoidan.github.io/hotkey-hub/) or `CONFIG.md` in releases for detailed documentation.
- `%APPDATA%/hotkey-hub/certs/cert.pem`: Client certificate for mutual TLS authentication
- `%APPDATA%/hotkey-hub/certs/key.pem`: Client private key
- `%APPDATA%/hotkey-hub/certs/ca-cert.pem`: CA certificate

where `APPDATA` is `~/.config` on linux and `C:\Users\<username>\AppData\Roaming` on Windows:

### Optional Files
- `%APPDATA%/hotkey-hub/variables.json`: Custom variables file (any valid JSON with a root object) that can be referenced in your configurations

## Get started

### Remote
Install [http-remote-pc-control](https://github.com/akoidan/http-remote-pc-control) on a remote PC which you want to control.

### Certificates (Required)
The client and server use [mutual TLS authentication](https://www.cloudflare.com/learning/access-management/what-is-mutual-tls/).
Generates them based on [Certificates](https://github.com/akoidan/http-remote-pc-control?tab=readme-ov-file#certificates) section.
You need to have following files which you can copy from `%APPDATA%/http-remote-pc-control/certs/client/` when generating with `http-remote-pc-control`:
- `%APPDATA%/hotkey-hub/key.pem`
- `%APPDATA%/hotkey-hub/cert.pem`
- `%APPDATA%/hotkey-hub/ca-cert.pem`

where `APPDATA` is `~/.config` on linux and `C:\Users\<username>\AppData\Roaming` on Windows:

**If client and server certificates are different, you'll get an exception on startup indicating that the server is unable to connect to the client**

### Define Main Configuration (Required)

Example of `%APPDATA%/hotkey-hub/config.jsonc`:
```json
{
  "ips": {
    "this": "127.0.0.1", // replace with the IP of the remote PC you have install http-remote-pc-control
  },
  "combinations": [
    {
      "commands": [
        {
          "performOnRemote": "typeText",
          "variables": {
            "text": "Hello world", // will literally type this text (press key by key)
          },
          "destination": "this",
        },
      ],
      "name": "Type text",
      // Note you need to have signal keys like alt, ctrl, shift, super (windows key) pressed. 
      // Since OS API usually requires them for a shortcut
      // any OS shortcuts allowd (Alt+1, Ctrl+Shift+2, etc)
      "shortCut": "Alt+1" // press this combination of keys to trigger keyPress + mouseMove
    }
  ]
}
```
There are 3 types of commands:
- [local](https://akoidan.github.io/hotkey-hub/#localcommand) flow control commands. Examples are
    - Conditions with `if`
    - While and for loop with `loops`
    - Macros for reusable piece of code with `macro`
    - Expresssions to evaluate JS code and build conditions and arguments on it with `expression`
    - ...
- [Remote](https://akoidan.github.io/hotkey-hub/#remotecommand) commands:
    - keyboards events with e.g.  `performOnRemote: "typeText"`
    - mouse events with e.g. `performOnRemote: "mouseMove"`
    - window control with e.g. `performOnRemote: "focusProcessWindow"`
    - ...
- [Get info](https://akoidan.github.io/hotkey-hub/#getinfocommand) commands:
    - windows information getters with e.g.  `get: "activeWindow"`
    - ...

#### JSON Schema Support
You can validate your configuration using any JSON schema validator (e.g., [jsonschemavalidator.net](https://www.jsonschemavalidator.net/)):
1. Get the schema files from the [releases page](https://github.com/akoidan/hotkey-hub/releases)
2. Paste the schema into the validator's schema panel
3. Write/validate your configuration in the data panel

#### How to build config
- For the latest `main` branch documentation is available at [github-pages](https://akoidan.github.io/hotkey-hub) 
- Documentation per specific version is available in [releases](https://github.com/akoidan/hotkey-hub/releases) at `CONFIG.md` alog with `jsonc-schema.json`
- There are more examples in fixtures, e.g. [config-fixture.jsonc](./tests/fixtures/config-fixture.jsonc)
- You can use comments in jsonc file, but if you use online json schema validator it would complain about it.

### Variables (Optional)
Create `%APPDATA%/hotkey-hub/variables.json` to define custom variables:
- Can have any valid JSON structure with a root object
- To reference a variable use object with `$ref` keyword.  E.g. `"destination": "{"$ref": "varName"}`
- Variables can be referenced in `config.jsonc`

### Install the app

#### Ubuntu
- Install dependencies `sudo apt-get install libgcc-s1 libsm6 libxext6` if you dont have them yet.
- Download `hotkey-hub.deb` from [releases](https://github.com/akoidan/hotkey-hub/releases).
- Install the package `sudo dpkg -i hotkey-hub.deb`
- Put certificates in `~/.config/hotkey-hub/certs`
- Put configs in `~/.config/hotkey-hub/config.jsonc`
- Put variables in `~/.config/hotkey-hub/variables.jsonc`
- Start the service as a normal user: `systemctl --user start hotkey-hub` should be the same user as logged in X
- To view logs check `journalctl --user -o cat -u hotkey-hub -f`

#### Archlinux
- Install the package with `yay` or `paru` from AUR `yay -S hotkey-hub`
- Put certificates in `~/.config/hotkey-hub/certs`
- Put configs in `~/.config/hotkey-hub/config.jsonc`
- Put variables in `~/.config/hotkey-hub/variables.jsonc`
- Start the service as a normal user: `systemctl --user start hotkey-hub` should be the same user as logged in X
- To view logs check `journalctl --user -o cat -u hotkey-hub -f`

#### Other Linux distro
- You need X11 server with some of the dependencies (libgcc libsm libXext)
- Download `hotkey-hub.elf` from [releases](https://github.com/akoidan/hotkey-hub/releases).
- Ensure directory with the executable, or project directory contains `certs` directory with certificates
- run `chmod +x hotkey-hub.elf`
- Put certificates in `~/.config/hotkey-hub/certs/`
- Put configs in `~/.config/hotkey-hub/config.jsonc`
- Put variables in `~/.config/hotkey-hub/variables.jsonc`
- Start the service from the non-root X user `./hotkey-hub.elf`
- If you need systemd unit, check [hotkey-hub.service](./packages/hotkey-hub.service)

#### Windows
- Download `hotkey-hub.exe` from [releases](https://github.com/akoidan/hotkey-hub/releases).
- Put certificates into `C:\Users\<username>\AppData\Roaming\hotkey-hub\certs`
- Put config file into `C:\Users\<username>\AppData\Roaming\hotkey-hub\config.jsonc`
- Run `hotkey-hub.exe`.

### Apply new config
If server is started under linux using systemd or with flag `--api-server`, running `hotkey-hub` with `--config-file` or `--variables-file` parameter will apply new configuration to existing server via http api, instead of creating a new process. E.g. after initial start of `systemctl --user start hotkey-hub`, use:
```bash
hotkey-hub --config-file=~/my-config.jsonc 
```

### Help
 - The app pings clients at startup to verify connections. If one/more clients in config.jsonc `ips` section is not reachable, the app will `exit 1`
 - If the certificats are incorrect you will get connection errors in the output and app will exit, e.g. unable to ping the client.
 - If the shortcut already taken you the app won't start as well with a corresponding error.
 - You can check cli arguments with `hotkey-hub --help`

## Log example
The app generates detailed logs to help understand complex command sequences. 
Every log line has its own request id (same for hotkey-hub and http-remote-pc-control), which allow to track complex structures.
Let's review log line:
```txt
[20:40:28.045] 2=mr7-c=0-th=tyrs-c=1=m=tyr-c=2=d=2hn: POST:201 lenovo /keyboard/key-press {"keys":["3"],"holdKeys":[]} ==> void
```
Every loop of commands is separated by `-`. `=` means that this is the meaning of this command.
- `[20:40:28.045]` - time and milliseconds
- `2=mr7` - alt+2 or similar keypress where 2 is a modifying key, and `mr7` is the id of this keypress
- `c=0` - command (`c`) number 0, of this shortcut keypress alt+2
- `th=tyrs` - thread (`th`) with name `tyrs`, which means that `c=0` of top is a threads command,
- `c=1=m=tyr` - first command (`c`) of this thread tyrs, which is a macro (`m`) with name `tyr`,
- `c=2=d=2hn`- 2nd command (`c`) which is a remote command (`d`= destination) that has and id `2hn`
- `POST:201 lenovo` Means a post request to destination `lenovo` is finished with HTTP status 201, where `lenovo` is a name from `ips` section in config.
- `/keyboard/key-press` url which is post request was made to
- `{"keys":["3"],"holdKeys":[]}` json payload of POST request
- `=>>>` response body which is empty. Nothing after `=>>>` is printed

## Development documentation
Check [CONTRIBUTING.md](CONTRIBUTING.md)
