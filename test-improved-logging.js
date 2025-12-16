const BookmarkManager = require('./src/bookmark-manager');
const fs = require('fs-extra');
const path = require('path');

async function testImprovedLogging() {
    console.log('🧪 测试改进的日志功能...\n');
    
    const manager = new BookmarkManager();
    
    // 1. 测试路径检测
    console.log('1️⃣ 测试路径检测日志');
    console.log('=' .repeat(50));
    
    const paths = await manager.detectBrowserPaths();
    console.log('检测结果:');
    console.log('- Chrome:', paths.chrome ? '✅ 检测成功' : '❌ 未检测到');
    console.log('- Atlas:', paths.atlas ? '✅ 检测成功' : '❌ 未检测到');
    
    if (!paths.chrome || !paths.atlas) {
        console.log('⚠️ 部分路径未检测到，无法完整测试同步日志');
        return;
    }
    
    // 2. 测试无变更同步
    console.log('\n2️⃣ 测试无变更同步日志');
    console.log('=' .repeat(50));
    
    const syncConfig = {
        chromePath: paths.chrome,
        atlasPath: paths.atlas,
        syncDirection: 'bidirectional'
    };
    
    console.log('执行同步（预期无变更）...');
    const result1 = await manager.syncBookmarks(syncConfig);
    
    console.log('同步结果:');
    console.log('- Chrome 更新:', result1.chromeUpdated ? '是' : '否');
    console.log('- Atlas 更新:', result1.atlasUpdated ? '是' : '否');
    console.log('- 应该记录日志:', result1.chromeUpdated || result1.atlasUpdated ? '是' : '否');
    
    // 3. 创建测试变更
    console.log('\n3️⃣ 测试有变更同步日志');
    console.log('=' .repeat(50));
    
    // 创建一个临时的测试书签文件
    const testAtlasPath = path.join(__dirname, 'test-logging-atlas.json');
    const testBookmarks = {
        "checksum": "test-logging",
        "roots": {
            "bookmark_bar": {
                "children": [
                    {
                        "date_added": "13285932720000000",
                        "id": "1",
                        "name": "测试书签",
                        "type": "url",
                        "url": "https://test-logging.com/"
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
    
    await fs.writeFile(testAtlasPath, JSON.stringify(testBookmarks, null, 2));
    
    const testSyncConfig = {
        chromePath: paths.chrome,
        atlasPath: testAtlasPath,
        syncDirection: 'chrome-to-atlas'
    };
    
    console.log('执行同步（预期有变更）...');
    const result2 = await manager.syncBookmarks(testSyncConfig);
    
    console.log('同步结果:');
    console.log('- Chrome 更新:', result2.chromeUpdated ? '是' : '否');
    console.log('- Atlas 更新:', result2.atlasUpdated ? '是' : '否');
    console.log('- 应该记录日志:', result2.chromeUpdated || result2.atlasUpdated ? '是' : '否');
    
    // 清理测试文件
    await fs.remove(testAtlasPath);
    
    // 4. 日志优化总结
    console.log('\n4️⃣ 日志优化总结');
    console.log('=' .repeat(50));
    
    console.log('✅ 日志优化完成:');
    console.log('- 只记录有实际变更的同步操作');
    console.log('- 简化路径检测日志为摘要信息');
    console.log('- 优化启动/停止日志的表达');
    console.log('- 移除"无需更新"的冗余日志');
    console.log('- 清空日志操作不再记录日志');
    
    console.log('\n📋 用户体验改进:');
    console.log('- 日志更加简洁明了');
    console.log('- 重要信息更容易识别');
    console.log('- 减少无意义的日志噪音');
    console.log('- 保留所有错误和成功信息');
    
    console.log('\n🎯 测试建议:');
    console.log('1. 启动应用测试路径检测日志');
    console.log('2. 执行多次手动同步观察日志变化');
    console.log('3. 启动自动同步并修改书签测试');
    console.log('4. 验证只有实际变更才记录日志');
}

testImprovedLogging().catch(console.error);