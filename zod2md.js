const {convertSchemas, formatModelsAsMarkdown, loadZodSchemas} = require('zod2md');

(async function main() {
  const schemas = await loadZodSchemas({
    entry: './src/config/types/schema.ts',
  });
  const models = convertSchemas(schemas);
  const res = formatModelsAsMarkdown(models, {
    title: 'Remote IP',
  });
  console.log(res);
})();
