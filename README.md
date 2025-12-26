# Hotkey Hub

Hotkey Hub is a powerful remote PC control tool that lets you bind hotkeys on one computer to trigger actions on another computer over HTTP. For example, you can press `alt+1` on your PC to trigger an `F1` keystroke on a remote PC.

## Features

- **Keyboard Control**: Bind local hotkeys to remote keystrokes
- **Mouse Control**: Move cursor and trigger clicks remotely
- **Process Management**: Run or kill executable files
- **Window Management**: Control window focus, size, and position

## Project Structure

The project requires several files for configuration and security:

### Required Files
- `configs/config.jsonc`: Main configuration file that defines your hotkey bindings and actions. Schema is defined in `json-schema.json`. See `CONFIG.md` in releases for detailed documentation.
- `certs/cert.pem`: Server certificate for mutual TLS authentication
- `certs/key.pem`: Server private key
- `certs/ca-cert.pem`: CA certificate

### Optional Files
- `configs/macros.jsonc`: Define reusable code snippets that can be referenced in `config.jsonc`. Schema is defined in `macros-schema.json`. See `CONFIG_MACROS.md` in releases for detailed documentation.
- `configs/variables.json`: Custom variables file (any valid JSON with a root object) that can be referenced in your configurations

## Get started

### Download the apps (Required)
- Download the server (the PC you controll others PCs) application file from [releases](https://github.com/akoidan/hotkey-hub/releases)
- For the remote PC download the client app from [client releases](https://github.com/akoidan/http-remote-pc-control/releases)

### Certificates (Requied)
The client server app both use [mutual TLS authentication](https://www.cloudflare.com/learning/access-management/what-is-mutual-tls/).
Generates them based on [Certificates](https://github.com/akoidan/http-remote-pc-control?tab=readme-ov-file#certificates) section.
You need to copy from the client:
 - `./gencert/client/key.pem`
 - `./gencert/client/cert.pem`
 - `./gencert/client/ca-cert.pem`
To `./certs` directory where app.exe is.

**If client and server certificates are different you'll get an exception on startup that server is unable to connnect to the client**

### Main Configuration (Required)
Create `configs/config.jsonc` in the same directory as your `app.exe`. This file defines your hotkey bindings and actions:
- Uses JSON with comments (JSONC) format
- Schema is defined in `json-schema.json`, available in [releases](https://github.com/akoidan/hotkey-hub/releases)
- Documentation is defined at `CONFIG.md`, available in [releases](https://github.com/akoidan/hotkey-hub/releases)
- Can reference macros and variables from optional configuration files

### Macros (Optional)
You can create macros in `configs/config.jsonc` and additionally in `configs/macros.jsonc`:
- Macroses helps avoid repetition in your main configuration
- Schema is defined in `macros-schema.json`, available in [releases](https://github.com/akoidan/hotkey-hub/releases)
- Documentation is defined at `CONFIG.md` same schema as "macros" in the root object. 
- Can be referenced from `config.jsonc`

### Variables (Optional)
Create `configs/variables.json` to define custom variables:
- Can have any valid JSON structure with a root object
- To reference a variable use double curly braces. E.g. `"destination": "{{myVar}}"`
- Variables can be referenced in both `config.jsonc` and `macros.jsonc`

### JSON Schema Support
You can validate your configuration using any JSON schema validator (e.g., [jsonschemavalidator.net](https://www.jsonschemavalidator.net/)):
1. Get the schema files from the [releases page](https://github.com/akoidan/hotkey-hub/releases)
2. Paste the schema into the validator's schema panel
3. Write/validate your configuration in the data panel

### Archlinux
- Install the app `yay -S hotkey-hub`
- Put certificates in `~/.local/share/hotkey-hub/certs` 
- Put configs in `~/.local/share/hotkey-hub/configs/config.jsonc` 
- Put macros in `~/.local/share/hotkey-hub/configs/macros.jsonc` 
- Put variables in `~/.local/share/hotkey-hub/configs/variables.jsonc` 
- Start the service as a normal user: `systemctl --user start hotkey-hub` should be the same user as logged in X

## Run the app
After configuration files are created, run the app from regular user. You can also run it from command line to view stdout and sterror if the app crashes. It check connection to remote PC/PCs, verifies the certificates and would be ready to listen shorcut press.

### Help
App allows minimal configuration, check the following command for options
```bash
app --help
```

## Log example
Every log line has its own request id, which allow to track complex structures.
Let's review log line:
```txt
[20:40:28.045] 2=mr7-c=0-th=tyrs-c=1=m=tyr-c=2=d=2hn: POST:201 lenovo /keyboard/key-press {"keys":["3"],"holdKeys":[]} ==>
```
Every loop of commands is separated by `-`, `=` means that this is the meaning of this command.
- `[20:40:28.045]` - time and .milliseconds
- `2=mr7` - alt+2 or similar keypres where 2 is a modyfying key, and `mr7` - id of this keypress
- `c=0` - command (`c`) number 0, of this shortcut keypress alt+2
- `th=tyrs` - thread (`th`) with name `tyrs`, which means that `c=0` of top is a threads command,
- `c=1=m=tyr` - first command (`c`) of this thread tyrs, which is a macro (`m`) with name name `tyr`,
- `c=2=d=2hn`- 2nd command (`c`) which is a remote command (`d`= destination) that has and id `2hn`
- `POST:201 lenovo` Means a post request to destination `lenovo` is finished with HTTP status 201, where `lenovo` is a name from `ips` section in config.
- `/keyboard/key-press` url which is post request was made to
- `{"keys":["3"],"holdKeys":[]}` json payload of POST request
- `=>>>` response body which is empty. Nothing after `=>>>` is printed

## Develop locally
Check [DEVELOPMENT.md](DEVELOPMENT.md)