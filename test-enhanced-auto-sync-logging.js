const BookmarkManager = require('./src/bookmark-manager');
const fs = require('fs-extra');
const path = require('path');

async function testEnhancedAutoSyncLogging() {
    console.log('🧪 测试增强的自动同步日志功能...\n');
    
    const manager = new BookmarkManager();
    
    // 1. 测试最新书签检测
    console.log('1️⃣ 测试最新书签检测功能');
    console.log('=' .repeat(50));
    
    const paths = await manager.detectBrowserPaths();
    
    if (paths.chrome) {
        const chromeBookmarks = await manager.readBookmarks(paths.chrome);
        const latestChrome = manager.detectLatestBookmarks(chromeBookmarks, 3);
        
        console.log('Chrome 最新书签:');
        latestChrome.forEach((bookmark, i) => {
            const date = new Date(bookmark.dateAdded / 1000);
            console.log(`  ${i+1}. ${bookmark.name} - ${bookmark.url}`);
            console.log(`     添加时间: ${date.toLocaleString()}`);
        });
    }
    
    if (paths.atlas) {
        const atlasBookmarks = await manager.readBookmarks(paths.atlas);
        const latestAtlas = manager.detectLatestBookmarks(atlasBookmarks, 3);
        
        console.log('\nAtlas 最新书签:');
        latestAtlas.forEach((bookmark, i) => {
            const date = new Date(bookmark.dateAdded / 1000);
            console.log(`  ${i+1}. ${bookmark.name} - ${bookmark.url}`);
            console.log(`     添加时间: ${date.toLocaleString()}`);
        });
    }
    
    // 2. 模拟自动同步场景
    console.log('\n2️⃣ 模拟自动同步日志场景');
    console.log('=' .repeat(50));
    
    // 创建模拟的 Atlas 书签文件（模拟用户在 Atlas 中新增书签）
    const testAtlasPath = path.join(__dirname, 'test-enhanced-atlas.json');
    const testBookmarks = {
        "checksum": "test-enhanced",
        "roots": {
            "bookmark_bar": {
                "children": [
                    {
                        "date_added": Date.now() * 1000 + "", // 当前时间，模拟刚添加的书签
                        "id": "1",
                        "name": "新增测试书签",
                        "type": "url",
                        "url": "https://new-test-bookmark.com/"
                    },
                    {
                        "date_added": (Date.now() - 60000) * 1000 + "", // 1分钟前
                        "id": "2", 
                        "name": "另一个新书签",
                        "type": "url",
                        "url": "https://another-new-bookmark.com/"
                    }
                ],
                "date_added": "13285932720000000",
                "date_modified": Date.now() * 1000 + "",
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
    
    await fs.writeFile(testAtlasPath, JSON.stringify(testBookmarks, null, 2));
    
    // 模拟同步操作
    if (paths.chrome) {
        const syncConfig = {
            chromePath: paths.chrome,
            atlasPath: testAtlasPath,
            syncDirection: 'bidirectional'
        };
        
        console.log('模拟 Atlas 浏览器书签更新触发自动同步...');
        const result = await manager.syncBookmarks(syncConfig);
        
        // 模拟自动同步日志输出
        console.log('\n📋 预期的自动同步日志输出:');
        console.log('🔄 检测到 Atlas 浏览器书签更新');
        
        if (result.latestBookmarks && result.latestBookmarks.atlas.length > 0) {
            const latest = result.latestBookmarks.atlas[0];
            console.log(`   → 更新内容: ${latest.name} - ${latest.url}`);
        }
        
        console.log('📤 向 Chrome 浏览器进行同步');
        
        if (result.syncedItems && result.syncedItems.addedToChrome.length > 0) {
            console.log(`📥 向 Chrome 同步了 ${result.syncedItems.addedToChrome.length} 个书签:`);
            result.syncedItems.addedToChrome.slice(0, 2).forEach(bookmark => {
                console.log(`   → ${bookmark.name} - ${bookmark.url}`);
            });
        }
        
        if (result.chromeUpdated) {
            console.log('💡 请重启 Chrome 浏览器查看同步结果');
        }
    }
    
    // 清理测试文件
    await fs.remove(testAtlasPath);
    
    // 3. 日志格式对比
    console.log('\n3️⃣ 日志格式对比');
    console.log('=' .repeat(50));
    
    console.log('❌ 旧版日志格式:');
    console.log('🔄 自动同步触发:');
    console.log('   → 同步了 1 个书签');
    console.log('   → 添加到 Chrome: 1 个');
    console.log('💡 请重启相关浏览器查看更新');
    
    console.log('\n✅ 新版日志格式:');
    console.log('🔄 检测到 Atlas 浏览器书签更新');
    console.log('   → 更新内容: 新增测试书签 - https://new-test-bookmark.com/');
    console.log('📤 向 Chrome 浏览器进行同步');
    console.log('📥 向 Chrome 同步了 1 个书签:');
    console.log('   → 新增测试书签 - https://new-test-bookmark.com/');
    console.log('💡 请重启 Chrome 浏览器查看同步结果');
    
    // 4. 功能总结
    console.log('\n4️⃣ 增强功能总结');
    console.log('=' .repeat(50));
    
    console.log('✅ 自动同步日志增强:');
    console.log('1. 明确说明触发同步的浏览器');
    console.log('2. 显示具体的更新内容（书签名和URL）');
    console.log('3. 清晰说明同步方向（从哪个浏览器到哪个浏览器）');
    console.log('4. 详细列出同步的书签内容');
    console.log('5. 精确指出需要重启的浏览器');
    
    console.log('\n📊 用户体验提升:');
    console.log('- 用户清楚知道是什么触发了同步');
    console.log('- 了解具体同步了什么内容');
    console.log('- 知道需要重启哪个浏览器');
    console.log('- 可以验证同步结果是否正确');
    
    console.log('\n🎯 实际使用场景:');
    console.log('场景: 用户在 Atlas 中添加新书签');
    console.log('1. 工具检测到 Atlas 文件变化');
    console.log('2. 识别新添加的书签内容');
    console.log('3. 向 Chrome 同步该书签');
    console.log('4. 提示用户重启 Chrome 查看结果');
}

testEnhancedAutoSyncLogging().catch(console.error);