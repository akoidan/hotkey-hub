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

### Certificates (Required)
The client and server apps both use [mutual TLS authentication](https://www.cloudflare.com/learning/access-management/what-is-mutual-tls/).
You need to define CA root cert, private key and certificate in cert directory as described in required files section.
You can use helper script to generate certificates with [gen-cert.sh](./gen-cert.sh).

```bash
bash ./gen-cert.sh
```

It will generate:
- self-sign CA certificate with its private key and put CA cert into both ./certs/ca-cert.pem and ./client/ca-cert.pem
- server and client private key in the ./certs/key.pem and ./client/key.pem
- server and client certificate that are signed with CA private key and put it into ./certs/cert.pem and ./client/cert.pem

Leave certs directory in the project or within the same directory you are running app executable file.
Copy client directory to the remote PC where you have the [client](https://github.com/akoidan/http-remote-pc-control)

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


## Develop locally

### Requirements:
You need cmake, yarn, node version 18 or nvm, and a proper C/C++ compiler toolchain of the given platform

#### Windows
  - [Visual C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/). If you installed nodejs with the installer, you can install these when prompted.
  - An alternate way is to install the [Chocolatey package manager](https://chocolatey.org/install), and run `choco install visualstudio2017-workload-vctools` in an Administrator Powershell
  - If you have multiple versions installed, you can select a specific version with `npm config set msvs_version 2017` (Note: this will also affect `node-gyp`)
  - [cmake](https://cmake.org/download/),
  - Node version 18 or [nvm](https://github.com/nvm-sh/nvm) 
  - [yarn](https://yarnpkg.com/). 
#### Unix/Posix
  - Clang or GCC
  - Ninja or Make (Ninja will be picked if both present)
  - Node version 18 or [nvm](https://github.com/nvm-sh/nvm)
  - [yarn](https://yarnpkg.com/).
#### MacOS  
  - brew install cmake nvm yarn
#### ArchLinux:
  - sudo pacman -S xcb-util-wm nvm yarn cmake g++

### Run in dev mode

To build the client you need

```sh
nvm use 18 # If you already have node 18, skip it
yarn # install depenencies
yarn build:local # builds native c++ modules 
yarn start # starts a nestjs server 
```

### Clion
If you want to debug native code, you need to build native module in a debug mode, `yarn build:local` already does it. Then you can attach to the nodejs process via gdb from Clion which should pull sourcemaps and allow to put breakpoints in native code. In order to start the process, you can still use `yarn start`, as soon as native module loads it will pull the breakpoints from IDE.

In order to have proper syntax highlight from nodejs headers, you have to manually add them to Clion configs:

Open Settings -> Cmake -> Add configuration

Add Cmake options:
```
 -DCMAKE_CXX_FLAGS="-I/home/andrew/.nvm/versions/node/v18.18.2/include/node -I/home/andrew/it/my-projects/http-remote-pc-control/node_modules/node-addon-api"
```
Replace **/home/andrew/** to your home directory. Do not use `~` alias, should be absolute path.
