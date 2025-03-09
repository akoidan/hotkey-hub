# Hotkey Hub
Allow to bind any hotkey in the OS to send a keyStroke to a remote PC via http.
Check https://github.com/akoidan/http-remote-pc-control
E.g. you press `alt+1` on your PC and remote one send a keyStroke `F1`.

## Get started

### Certificates

Generate certificates with [gen-cert.sh](./gen-cert.sh) for [MTLS](https://www.cloudflare.com/learning/access-management/what-is-mutual-tls/) encryption.

```bash
bash ./gen-cert.sh
```

It will generate:
 - self-sign CA certificate with its private key and put CA cert into both ./server/certs/ca-cert.pem and ./client/certs/ca-cert.pem
 - server and client private key in the ./server/certs/key.pem and ./client/certs/key.pem
 - server and client certificate thatis signed with CA private key and put it into  ./server/certs/cert.pem and ./server/certs/cert.pem


### Config
Create a config mapper file in the PC that you want to controll other PCs from. We call it server (see [Server](#server)) .The file should be named as **configs/config.jsonc** and be with the same directory as server app.exe. You can get examples of config files [examples](./examples) and documentation in README.md in release section [here](https://github.com/akoidan/hotkey-hub/releases). 

Also you can find json schema in the same release section of the server. You can use any editor that support json schema. E.g. [jsonschemavalidator.net](https://www.jsonschemavalidator.net/). Just paste the content from json-schema.json into the left panel of it, and you can write your config in the right panel. After it as I mentioned above put it into **config.jsonc** with the same directory you have you app.exe for the server.

 
### Server
 - Download application from [releases](https://github.com/akoidan/hotkey-hub/releases)
 - You already have your configs/config.jsonc described in [config](#config)
 - Put server sertificate into `certs` directory which is in the same directory as app.exe
 - run **app.exe** as regular user.
 - If it crasher, run it from cmd to get output

## Security
The client server app both use mutual TLS authentication. 
Client apps should be available withing the address provided in config. So either all apps are within same network. Or clients have public static IP address.

## OS support
- Windows
- Linux
- Mac is coming...

This product has 2 apps: Client and Server. Native binaries are shipped via [pkg](https://www.npmjs.com/package/pkg) that packs Nodejs inside of the executable. Both apps support Window/Linux and Mac support is coming soon

## Autostart
Add a script to autostart in Windows with admin petrmissions: Replace path to your app.exe:
```shell
@echo off
setlocal

:: Replace with the path to your program
set "ProgramPath=C:\Users\msi\Downloads\app.exe"
set "ProgramName=L2"

:: Create the task in Task Scheduler for admin startup
schtasks /create /tn "%ProgramName%" /tr "\"%ProgramPath%\"" /sc onlogon /rl highest /f

if %errorlevel% equ 0 (
echo Program added to startup with admin permissions successfully.
) else (
echo Failed to add program to startup.
)

pause
```

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
Open Settings -> Cmake -> Add configuration

Add Cmake options:
```
 -DCMAKE_CXX_FLAGS="-I/home/andrew/.nvm/versions/node/v18.18.2/include/node -I/home/andrew/it/my-projects/http-remote-pc-control/node_modules/node-addon-api"
```
Replace **/home/andrew/** to your home directory. Do not use `~` alias, should be absolute path.
