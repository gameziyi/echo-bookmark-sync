const fs = require('fs');
const path = require('path');
const os = require('os');

const homeDir = os.homedir();
console.log(`🏠 Home Directory: ${homeDir}`);
console.log('🔍 Starting Atlas Path Diagnosis...\n');

// 1. Check common directories in Application Support
const appSupport = path.join(homeDir, 'Library/Application Support');
console.log(`📂 Scanning: ${appSupport}`);

try {
    const dirs = fs.readdirSync(appSupport);
    const atlasRelated = dirs.filter(d =>
        d.toLowerCase().includes('atlas') ||
        d.toLowerCase().includes('openai') ||
        d.toLowerCase().includes('chatgpt')
    );

    if (atlasRelated.length > 0) {
        console.log('Found potentially related directories:');
        atlasRelated.forEach(d => console.log(` - ${d}`));

        // Deep scan of found directories
        console.log('\n🕵️‍♀️ Deep scanning found directories for JSON files or Bookmarks...');
        atlasRelated.forEach(d => {
            const fullPath = path.join(appSupport, d);
            checkRecursively(fullPath, 0);
        });
    } else {
        console.log('❌ No directory names matching "atlas", "openai", or "chatgpt" found in Application Support.');
    }
} catch (err) {
    console.error(`Error reading Application Support: ${err.message}`);
}

function checkRecursively(dir, depth) {
    if (depth > 3) return; // Limit depth
    try {
        const items = fs.readdirSync(dir);
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                // Check for "Local Storage", "User Data", "Default" etc in specific cases if needed, but simple recursive is okay for now
                checkRecursively(fullPath, depth + 1);
            } else {
                if (item === 'Bookmarks' || item === 'bookmarks.json' || item.endsWith('.json')) {
                    console.log(`   📄 Found potential file: ${fullPath} (${stat.size} bytes)`);
                    // Try to read if it looks like bookmarks
                    if (stat.size > 0 && stat.size < 10000000) { // Limit size check
                        try {
                            const content = fs.readFileSync(fullPath, 'utf8');
                            if (content.includes('"roots"') && content.includes('"bookmark_bar"')) {
                                console.log(`      ✅ !!! CONFIRMED BOOKMARKS FILE !!!`);
                            }
                        } catch (e) { }
                    }
                }
            }
        }
    } catch (e) {
        // Ignore access errors
    }
}

console.log('\n🏁 Diagnosis Complete.');
