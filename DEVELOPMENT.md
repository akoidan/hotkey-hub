# Develop locally

## Requirements:
You need cmake, yarn, node version 18 or nvm, and a proper C/C++ compiler toolchain of the given platform

## Windows
- [Visual C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/). If you installed nodejs with the installer, you can install these when prompted.
- An alternate way is to install the [Chocolatey package manager](https://chocolatey.org/install), and run `choco install visualstudio2017-workload-vctools` in an Administrator Powershell
- If you have multiple versions installed, you can select a specific version with `npm config set msvs_version 2017` (Note: this will also affect `node-gyp`)
- [cmake](https://cmake.org/download/),
- Node version 18 or [nvm](https://github.com/nvm-sh/nvm)
- [yarn](https://yarnpkg.com/).
## Unix/Posix
- Clang or GCC
- Ninja or Make (Ninja will be picked if both present)
- Node version 18 or [nvm](https://github.com/nvm-sh/nvm)
- [yarn](https://yarnpkg.com/).
## MacOS
- brew install cmake nvm yarn
## ArchLinux:
- sudo pacman -S xcb-util-wm nvm yarn cmake g++

## Run in dev mode

To build the client you need

```sh
nvm use 18 # If you already have node 18, skip it
yarn # install depenencies
yarn cmake # builds native c++ modules 
yarn start # starts a nestjs server 
```

## Debugging Native Code with CLion

If you want to debug native Node.js modules in **CLion**, you need to build the module in **Debug mode**.

## 1. Build the Native Module
Run:
```bash
yarn cmake:debug
```  
This command already builds the native module in Debug mode.

## 2. Start and Attach the Debugger
- Start your app with:
  ```bash
  yarn start
  ```  
- Once the native module loads, attach CLion’s debugger (`gdb`) to the running Node.js process. NOTE: this should be node process, not parent yarn process.
- CLion will automatically pull sourcemaps, allowing you to place breakpoints in native C++ code.

## 3. Enable Syntax Highlighting for Node.js Headers
CLion does not automatically pick up Node.js and N-API headers. You must add them manually:

**Steps:**
1. Go to **Settings → Build, Execution, Deployment → CMake**.
2. Add a new configuration.
3. Select ninja generator and select build directory `build`
4. Add the following to **CMake options** (adjust paths for your system).

### Arch Linux example
```cmake
-DCMAKE_CXX_FLAGS="-I/home/andrew/.nvm/versions/node/v18.18.2/include/node -I/home/andrew/it/my-projects/hotkey-hub/node_modules/node-addon-api"
```

### Windows example
But debug won't work
```cmake
-DCMAKE_CXX_FLAGS="-IC:\Users\death\.cmake-js\node-x64\v18.20.5\include\node -IC:\Users\death\WebstormProjects\hotkey-hub\node_modules\node-addon-api"
```

## 4. Required Directories
You need to provide **two include directories**:

- **Node.js headers**
    - Example: `.../include/node`
    - Contains `node.h`, `node_api.h`, etc.
    - If missing, run:
      ```bash
      npx cmake-js print-cmakejs-src
      ```  

- **N-API headers**
    - Example: `.../node_modules/node-addon-api`
    - Contains `napi.h` and related files.



### Arhitetcure
If you have worked with Redux Saga or Python Tornado or something form asyncio implementation, you'd notice this project follows the same principle. Commands are processed in a queue, and in order to notify about next atomic piece, they yield to the parent queue executor which is eventually a ShortcutProcessingService. ShortcutProcessingService.runShortcut is a async generator executor. It allows high level control over execution flow which can be fetched from multiple deeps down levels. Since some shortcuts can have a bevavior "pausable" or "restart", we need to have a way to pause or terminate each set of commands at any point of time. One of the solution could be a global flag and checking this flag everywhere in across all items, which would totally break DRY principle and lead to bugs eventually. This is why async generator approach was chosen.

The generator follow some simple rules:

- Each item should yield every atomic operation to the parent.
- Items are allowed to have await operation as long as all operations in the item is considered a part of the transaction (atomic operations). Thus we dont want them to stop in the middle even if we terminate shortcut. In other words they have to finish.
- Await delays should yield a number (which is a miliseconds delay) to parent executor in order to be able to terminate during sleep.
- Complex operations like threads should properly handle children and reyield all operations to parent executor. 
- Every nested command should have its own identifier which is reflected in logs. This is done via SemaphorService.spawnPromiseChild