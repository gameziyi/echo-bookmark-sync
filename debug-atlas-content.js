const fs = require('fs-extra');
const path = '/Users/Winnie.C/Library/Application Support/com.openai.atlas/browser-data/host/user-1KkHMDzCxaqyqhj5bOhQdKZL__5ed50dce-2184-4edf-9bd3-65638288bfe5/Bookmarks';

async function inspectBookmarks() {
    try {
        if (!await fs.pathExists(path)) {
            console.error('File does not exist:', path);
            return;
        }

        const content = await fs.readFile(path, 'utf8');
        const data = JSON.parse(content);

        console.log('--- Root Keys ---');
        console.log(Object.keys(data));

        if (data.roots) {
            console.log('\n--- Roots Keys ---');
            console.log(Object.keys(data.roots));

            if (data.roots.bookmark_bar) {
                console.log('\n--- Bookmark Bar ---');
                console.log('Type:', data.roots.bookmark_bar.type);
                console.log('Children count:', data.roots.bookmark_bar.children ? data.roots.bookmark_bar.children.length : 'undefined');
            } else {
                console.log('\n❌ No bookmark_bar in roots');
            }

            if (data.roots.other) {
                console.log('\n--- Other Bookmarks ---');
                console.log('Children count:', data.roots.other.children ? data.roots.other.children.length : 'undefined');
            }
        } else {
            console.log('\n❌ No roots key found');
        }

    } catch (e) {
        console.error('Error:', e);
    }
}

inspectBookmarks();
