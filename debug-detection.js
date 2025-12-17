const BookmarkManager = require('./src/bookmark-manager');

async function debugDetection() {
    console.log('--- Starting Debug Detection ---');
    const manager = new BookmarkManager();

    try {
        console.log('Testing detectAtlasPath...');
        const path = await manager.detectAtlasPath();
        console.log('Result:', path);

        // Also manually verify the specific path we think works
        const fs = require('fs-extra');
        const os = require('os');
        const knownPath = require('path').join(os.homedir(), 'Library/Application Support/com.openai.atlas/browser-data/host/Default/Bookmarks');
        console.log('Checking known path directly:', knownPath);
        const exists = await fs.pathExists(knownPath);
        console.log('Known path exists?', exists);

        if (exists) {
            const userDirs = await fs.readdir(require('path').join(os.homedir(), 'Library/Application Support/com.openai.atlas/browser-data/host'));
            console.log('User dirs in host:', userDirs);
        }

    } catch (e) {
        console.error('Debug failed:', e);
    }
}

debugDetection();
