const BookmarkManager = require('./src/bookmark-manager');
const fs = require('fs-extra');
const path = require('path');

async function testBookmarkManager() {
    console.log('🧪 测试书签管理器...\n');
    
    const manager = new BookmarkManager();
    
    // 测试1: 检测浏览器路径
    console.log('1️⃣ 测试浏览器路径检测:');
    try {
        const paths = await manager.detectBrowserPaths();
        console.log('✅ Chrome 路径:', paths.chrome || '未检测到');
        console.log('✅ Atlas 路径:', paths.atlas || '未检测到');
    } catch (error) {
        console.log('❌ 路径检测失败:', error.message);
    }
    
    // 测试2: 创建测试书签文件
    console.log('\n2️⃣ 创建测试书签文件:');
    const testDir = path.join(__dirname, 'test-bookmarks');
    await fs.ensureDir(testDir);
    
    const chromeTestBookmarks = {
        "checksum": "test123",
        "roots": {
            "bookmark_bar": {
                "children": [
                    {
                        "date_added": "13285932710000000",
                        "id": "1",
                        "name": "Google",
                        "type": "url",
                        "url": "https://www.google.com/"
                    }
                ],
                "date_added": "13285932710000000",
                "date_modified": "0",
                "id": "1",
                "name": "书签栏",
                "type": "folder"
            },
            "other": {
                "children": [],
                "date_added": "13285932710000000",
                "date_modified": "0",
                "id": "2",
                "name": "其他书签",
                "type": "folder"
            }
        },
        "version": 1
    };
    
    const atlasTestBookmarks = {
        "checksum": "test456",
        "roots": {
            "bookmark_bar": {
                "children": [
                    {
                        "date_added": "13285932720000000",
                        "id": "2",
                        "name": "ChatGPT",
                        "type": "url",
                        "url": "https://chat.openai.com/"
                    }
                ],
                "date_added": "13285932720000000",
                "date_modified": "0",
                "id": "1",
                "name": "书签栏",
                "type": "folder"
            },
            "other": {
                "children": [],
                "date_added": "13285932720000000",
                "date_modified": "0",
                "id": "2",
                "name": "其他书签",
                "type": "folder"
            }
        },
        "version": 1
    };
    
    const chromeTestPath = path.join(testDir, 'chrome-bookmarks.json');
    const atlasTestPath = path.join(testDir, 'atlas-bookmarks.json');
    
    await fs.writeFile(chromeTestPath, JSON.stringify(chromeTestBookmarks, null, 2));
    await fs.writeFile(atlasTestPath, JSON.stringify(atlasTestBookmarks, null, 2));
    
    console.log('✅ 测试文件已创建');
    console.log('   Chrome 测试文件:', chromeTestPath);
    console.log('   Atlas 测试文件:', atlasTestPath);
    
    // 测试3: 读取书签
    console.log('\n3️⃣ 测试书签读取:');
    try {
        const chromeBookmarks = await manager.readBookmarks(chromeTestPath);
        const atlasBookmarks = await manager.readBookmarks(atlasTestPath);
        
        console.log('✅ Chrome 书签读取成功，书签数量:', chromeBookmarks.roots.bookmark_bar.children.length);
        console.log('✅ Atlas 书签读取成功，书签数量:', atlasBookmarks.roots.bookmark_bar.children.length);
    } catch (error) {
        console.log('❌ 书签读取失败:', error.message);
    }
    
    // 测试4: 同步书签
    console.log('\n4️⃣ 测试书签同步:');
    try {
        const syncConfig = {
            chromePath: chromeTestPath,
            atlasPath: atlasTestPath,
            syncDirection: 'bidirectional'
        };
        
        const result = await manager.syncBookmarks(syncConfig);
        console.log('✅ 同步完成:', result);
        
        // 验证同步结果
        const syncedChrome = await manager.readBookmarks(chromeTestPath);
        const syncedAtlas = await manager.readBookmarks(atlasTestPath);
        
        console.log('📊 同步后 Chrome 书签数量:', syncedChrome.roots.bookmark_bar.children.length);
        console.log('📊 同步后 Atlas 书签数量:', syncedAtlas.roots.bookmark_bar.children.length);
        
    } catch (error) {
        console.log('❌ 同步失败:', error.message);
    }
    
    // 清理测试文件
    console.log('\n🧹 清理测试文件...');
    await fs.remove(testDir);
    console.log('✅ 清理完成');
    
    console.log('\n🎉 测试完成！');
}

// 运行测试
testBookmarkManager().catch(console.error);