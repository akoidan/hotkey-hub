# l2
Script bindings to send Keyboard strokes to multiple PCs using shorcuts on the local one.
E.g. you press `alt+1` and on other PC keyStroke `F1` is triggered.

## How to use

### Remote PC
In order to have control you need to install [Unified remote](https://www.unifiedremote.com/) on all PCs that you want to control
For each unified remote go it its settings at http://localhost:9510/web/#/settings/network and check **allow remote web access**

For custom combination, like. ctrl+f2 or alt+tab take a look at [unified_remote/README.md](unified_remote/README.md)


### Local PC
You can use nodejs for windows v20. The default installation should come with build tools support for electron.

```bash
nvm use #or use node v20
yarn # install packages
yarn start
```


## Zod vs Class-validator

#### ZoD
 - schema first, and then dto. Which is less intuitive
 - dtos lacks type safety
 + Zod provides a really enhansed validation, with things like Record<string,string[]> and etc, class validator cannot handle it.

