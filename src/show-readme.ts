import a from "../config.json";

for (const k of a.combinations) {
    // @ts-ignore
    if (k.name) {
        // @ts-ignore
        console.log(`${k.shortCut} ${k.name}`)
    }
}