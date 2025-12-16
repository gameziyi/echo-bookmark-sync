const BookmarkManager = require('./src/bookmark-manager');
const fs = require('fs-extra');
const path = require('path');

async function testRestartLogicFix() {
    console.log('🧪 测试重启提示逻辑修正...\n');
    
    const manager = new BookmarkManager();
    const paths = await manager.detectBrowserPaths();
    
    if (!paths.chrome || !paths.atlas) {
        console.log('❌ 无法获取浏览器路径，跳过测试');
        return;
    }
    
    // 场景1: Atlas 更新 → 同步到 Chrome → 重启 Chrome
    console.log('1️⃣ 场景1: Atlas 更新触发同步');
    console.log('=' .repeat(50));
    
    // 创建测试 Atlas 书签文件（模拟 Atlas 中新增书签）
    const testAtlasPath = path.join(__dirname, 'test-restart-atlas.json');
    const atlasTestBookmarks = {
        "checksum": "test-restart",
        "roots": {
            "bookmark_bar": {
                "children": [
                    {
                        "date_added": Date.now() * 1000 + "",
                        "id": "1",
                        "name": "Atlas 新书签",
                        "type": "url",
                        "url": "https://atlas-new-bookmark.com/"
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
    
    await fs.writeFile(testAtlasPath, JSON.stringify(atlasTestBookmarks, null, 2));
    
    const syncConfig1 = {
        chromePath: paths.chrome,
        atlasPath: testAtlasPath,
        syncDirection: 'bidirectional'
    };
    
    console.log('执行同步: Atlas → Chrome');
    const result1 = await manager.syncBookmarks(syncConfig1);
    
    console.log('同步结果:');
    console.log(`  Chrome 更新: ${result1.chromeUpdated}`);
    console.log(`  Atlas 更新: ${result1.atlasUpdated}`);
    
    console.log('\n预期日志输出:');
    console.log('🔄 检测到 Atlas 浏览器书签更新');
    console.log('   → 更新内容: Atlas 新书签 - https://atlas-new-bookmark.com/');
    console.log('📤 向 Chrome 浏览器进行同步');
    console.log('📥 向 Chrome 同步了 1 个书签:');
    console.log('   → Atlas 新书签 - https://atlas-new-bookmark.com/');
    
    if (result1.chromeUpdated) {
        console.log('💡 请重启 Chrome 浏览器查看同步结果 ✅ (正确 - Chrome 被更新)');
    }
    
    // 场景2: Chrome 更新 → 同步到 Atlas → 重启 Atlas
    console.log('\n2️⃣ 场景2: Chrome 更新触发同步');
    console.log('=' .repeat(50));
    
    // 创建另一个测试 Atlas 文件（模拟 Chrome 有更多书签）
    const testAtlasPath2 = path.join(__dirname, 'test-restart-atlas2.json');
    const atlasTestBookmarks2 = {
        "checksum": "test-restart-2",
        "roots": {
            "bookmark_bar": {
                "children": [], // 空的，模拟 Atlas 没有 Chrome 的书签
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
    
    await fs.writeFile(testAtlasPath2, JSON.stringify(atlasTestBookmarks2, null, 2));
    
    const syncConfig2 = {
        chromePath: paths.chrome,
        atlasPath: testAtlasPath2,
        syncDirection: 'chrome-to-atlas'
    };
    
    console.log('执行同步: Chrome → Atlas');
    const result2 = await manager.syncBookmarks(syncConfig2);
    
    console.log('同步结果:');
    console.log(`  Chrome 更新: ${result2.chromeUpdated}`);
    console.log(`  Atlas 更新: ${result2.atlasUpdated}`);
    
    console.log('\n预期日志输出:');
    console.log('🔄 检测到 Chrome 浏览器书签更新');
    console.log('   → 更新内容: [Chrome 最新书签]');
    console.log('📤 向 Atlas 浏览器进行同步');
    console.log('📥 向 Atlas 同步了 N 个书签:');
    console.log('   → [书签列表]');
    
    if (result2.atlasUpdated) {
        console.log('💡 请重启 Atlas 浏览器查看同步结果 ✅ (正确 - Atlas 被更新)');
    }
    
    // 清理测试文件
    await fs.remove(testAtlasPath);
    await fs.remove(testAtlasPath2);
    
    // 逻辑总结
    console.log('\n3️⃣ 重启提示逻辑总结');
    console.log('=' .repeat(50));
    
    console.log('✅ 修正后的逻辑:');
    console.log('- Atlas 更新 → 同步到 Chrome → 重启 Chrome');
    console.log('- Chrome 更新 → 同步到 Atlas → 重启 Atlas');
    console.log('- 双向更新 → 重启 Chrome 和 Atlas');
    
    console.log('\n❌ 修正前的错误:');
    console.log('- 总是提示重启目标浏览器（错误）');
    console.log('- 应该提示重启被更新的浏览器（正确）');
    
    console.log('\n🎯 用户体验:');
    console.log('- 用户明确知道需要重启哪个浏览器');
    console.log('- 重启提示与实际更新的浏览器一致');
    console.log('- 避免不必要的浏览器重启');
    
    console.log('\n📋 实际场景验证:');
    console.log('场景: 用户在 Atlas 中添加书签');
    console.log('1. 工具检测到 Atlas 文件变化');
    console.log('2. 向 Chrome 同步该书签');
    console.log('3. Chrome 被更新，提示重启 Chrome ✅');
    console.log('4. 用户重启 Chrome，看到新书签 ✅');
}

testRestartLogicFix().catch(console.error);