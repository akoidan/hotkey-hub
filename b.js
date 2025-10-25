const fs = require('fs');
const path = require('path');
const { parse, applyEdits, modify } = require('jsonc-parser');

// Directory to search in
const searchDir = path.join(__dirname, 'examples', 'config');

// Function to process a single file
function processFile(filePath) {
  try {
    // Read file as text to preserve comments (since it's JSONC)
    const content = fs.readFileSync(filePath, 'utf8');

    // Parse JSONC
    const jsonData = parse(content);

    // Track if we need to modify the file
    let contentToWrite = content;
    let modified = false;

    // Function to find and replace all {{var}} patterns
    function findAndReplace(obj, path = []) {
      if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          if (typeof item === 'object' && item !== null) {
            findAndReplace(item, [...path, index]);
          } else if (typeof item === 'string' && item.startsWith('{{') && item.endsWith('}}')) {
            const varName = item.slice(2, -2).trim();
            const editPath = [...path, index];
            const newValue = { $ref: varName };

            // Create edit
            const edits = modify(contentToWrite, editPath, newValue, {
              formattingOptions: {
                tabSize: 2,
                insertSpaces: true,
                eol: '\n'
              }
            });

            // Apply edits
            contentToWrite = applyEdits(contentToWrite, edits);
            modified = true;
          }
        });
      } else if (typeof obj === 'object' && obj !== null) {
        Object.entries(obj).forEach(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            findAndReplace(value, [...path, key]);
          } else if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
            const varName = value.slice(2, -2).trim();
            const editPath = [...path, key];
            const newValue = { $ref: varName };

            // Create edit
            const edits = modify(contentToWrite, editPath, newValue, {
              formattingOptions: {
                tabSize: 2,
                insertSpaces: true,
                eol: '\n'
              }
            });

            // Apply edits
            contentToWrite = applyEdits(contentToWrite, edits);
            modified = true;
          }
        });
      }
    }

    // Process the root object
    findAndReplace(jsonData);

    // If any modifications were made, save the file
    if (modified) {
      fs.writeFileSync(filePath, contentToWrite, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
    } else {
      console.log(`ℹ️ No changes needed: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

// Recursively find all .jsonc and .json files
function processDirectory(directory) {
  const files = fs.readdirSync(directory, { withFileTypes: true });

  for (const file of files) {
    const fullPath = path.join(directory, file.name);

    if (file.isDirectory()) {
      processDirectory(fullPath);
    } else if (file.name.endsWith('.jsonc') || file.name.endsWith('.json')) {
      console.log(`🔍 Processing: ${fullPath}`);
      processFile(fullPath);
    }
  }
}

// Start processing
console.log('🚀 Starting to process files...');
processDirectory(searchDir);
console.log('✅ Processing complete!');