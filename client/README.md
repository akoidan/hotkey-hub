**Requirements:**

- [CMake](http://www.cmake.org/download/)
- A proper C/C++ compiler toolchain of the given platform
  - **Windows**:
    - [Visual C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/). If you installed nodejs with the installer, you can install these when prompted.
    - An alternate way is to install the [Chocolatey package manager](https://chocolatey.org/install), and run `choco install visualstudio2017-workload-vctools` in an Administrator Powershell
    - If you have multiple versions installed, you can select a specific version with `npm config set msvs_version 2017` (Note: this will also affect `node-gyp`)
  - **Unix/Posix**:
    - Clang or GCC
    - Ninja or Make (Ninja will be picked if both present)




# Runtime
- **ArchLinux**:
  - sudo pacman -S xcb-util-wm  
