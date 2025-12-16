const BookmarkManager = require('./src/bookmark-manager');
const fs = require('fs-extra');
const path = require('path');

async function testDetailedLogging() {
    console.log('🧪 测试详细日志功能...\n');
    
    const manager = new BookmarkManager();
    
    // 1. 测试书签分析功能
    console.log('1️⃣ 测试书签分析功能');
    console.log('=' .repeat(50));
    
    const paths = await manager.detectBrowserPaths();
    
    if (paths.chrome && paths.atlas) {
        const chromeBookmarks = await manager.readBookmarks(paths.chrome);
        const atlasBookmarks = await manager.readBookmarks(paths.atlas);
        
        console.log('Chrome 书签分析:');
        const chromeStats = manager.analyzeBookmarks(chromeBookmarks);
        console.log(`  总书签: ${chromeStats.totalBookmarks}`);
        console.log(`  文件夹: ${chromeStats.totalFolders}`);
        console.log(`  书签栏项目: ${chromeStats.bookmarkBarItems}`);
        console.log(`  其他书签项目: ${chromeStats.otherBookmarksItems}`);
        
        console.log('\nAtlas 书签分析:');
        const atlasStats = manager.analyzeBookmarks(atlasBookmarks);
        console.log(`  总书签: ${atlasStats.totalBookmarks}`);
        console.log(`  文件夹: ${atlasStats.totalFolders}`);
        console.log(`  书签栏项目: ${atlasStats.bookmarkBarItems}`);
        console.log(`  其他书签项目: ${atlasStats.otherBookmarksItems}`);
        
        // 2. 测试差异比较
        console.log('\n2️⃣ 测试差异比较功能');
        console.log('=' .repeat(50));
        
        const comparison = manager.compareBookmarks(chromeBookmarks, atlasBookmarks);
        
        console.log('差异分析结果:');
        console.log(`  Chrome 独有: ${comparison.differences.onlyInChrome.length} 个`);
        console.log(`  Atlas 独有: ${comparison.differences.onlyInAtlas.length} 个`);
        console.log(`  共同书签: ${comparison.differences.common.length} 个`);
        console.log(`  需要同步: ${comparison.differences.needsSync ? '是' : '否'}`);
        
        if (comparison.differences.onlyInChrome.length > 0) {
            console.log('\nChrome 独有书签示例:');
            comparison.differences.onlyInChrome.slice(0, 3).forEach((bookmark, i) => {
                console.log(`  ${i+1}. ${bookmark.name} - ${bookmark.url}`);
            });
        }
        
        if (comparison.differences.onlyInAtlas.length > 0) {
            console.log('\nAtlas 独有书签示例:');
            comparison.differences.onlyInAtlas.slice(0, 3).forEach((bookmark, i) => {
                console.log(`  ${i+1}. ${bookmark.name} - ${bookmark.url}`);
            });
        }
        
        // 3. 测试详细同步
        console.log('\n3️⃣ 测试详细同步功能');
        console.log('=' .repeat(50));
        
        // 创建测试书签文件
        const testAtlasPath = path.join(__dirname, 'test-detailed-atlas.json');
        const testBookmarks = {
            "checksum": "test-detailed",
            "roots": {
                "bookmark_bar": {
                    "children": [
                        {
                            "date_added": "13285932720000000",
                            "id": "1",
                            "name": "测试详细日志",
                            "type": "url",
                            "url": "https://test-detailed-logging.com/"
                        },
                        {
                            "date_added": "13285932730000000",
                            "id": "2",
                            "name": "另一个测试书签",
                            "type": "url",
                            "url": "https://another-test.com/"
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
        
        console.log('执行详细同步测试...');
        const syncResult = await manager.syncBookmarks(testSyncConfig);
        
        console.log('同步结果:');
        console.log(`  Chrome 更新: ${syncResult.chromeUpdated}`);
        console.log(`  Atlas 更新: ${syncResult.atlasUpdated}`);
        console.log(`  总同步数量: ${syncResult.syncedItems.totalSynced}`);
        console.log(`  添加到 Chrome: ${syncResult.syncedItems.addedToChrome.length}`);
        console.log(`  添加到 Atlas: ${syncResult.syncedItems.addedToAtlas.length}`);
        
        if (syncResult.beforeSync) {
            console.log('\n同步前差异:');
            console.log(`  Chrome 独有: ${syncResult.beforeSync.differences.onlyInChrome.length}`);
            console.log(`  Atlas 独有: ${syncResult.beforeSync.differences.onlyInAtlas.length}`);
        }
        
        // 清理测试文件
        await fs.remove(testAtlasPath);
        
    } else {
        console.log('❌ 无法获取浏览器路径，跳过详细测试');
    }
    
    // 4. 功能总结
    console.log('\n4️⃣ 详细日志功能总结');
    console.log('=' .repeat(50));
    
    console.log('✅ 新增功能:');
    console.log('- 启动时状态报告');
    console.log('- 详细的书签统计信息');
    console.log('- 同步前差异分析');
    console.log('- 同步后详细结果');
    console.log('- 书签结构和数量统计');
    
    console.log('\n📊 日志改进:');
    console.log('- 启动时显示两个浏览器的书签统计');
    console.log('- 同步前显示需要同步的书签清单');
    console.log('- 同步后显示具体同步了哪些书签');
    console.log('- 路径异常时提供明确的解决建议');
    
    console.log('\n🎯 用户体验提升:');
    console.log('- 用户清楚知道当前书签状态');
    console.log('- 了解同步前后的具体变化');
    console.log('- 获得详细的操作指导');
    console.log('- 问题诊断更加容易');
}

testDetailedLogging().catch(console.error);