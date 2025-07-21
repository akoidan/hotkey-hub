// TypeScript (but this also compiles with no errors)
async function* inner() {
  await new Promise(resolve => setTimeout(resolve, 1000));
  yield 1;
  await new Promise(resolve => setTimeout(resolve, 1000));
  yield 2;
  await new Promise(resolve => setTimeout(resolve, 1000));
}

async function* outer() {
  // Invalid at runtime — TypeScript allows it
  await new Promise(resolve => setTimeout(resolve, 1000));
  yield* inner();
  await new Promise(resolve => setTimeout(resolve, 1000));
}

(async () => {
  for await (const val of outer()) {
    console.log(val);
  }
})();