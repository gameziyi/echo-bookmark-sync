#!/usr/bin/env node

const BookmarkManager = require('./src/bookmark-manager');
const AtlasRestartHelper = require('./atlas-restart-helper');
const fs = require('fs-extra');

console.log('🔧 修复 v2.1 版本问题...\n');

async function fixIssues() {
    console.log('📋 问题诊断和修复:');
    console.log('=' .repeat(50));
    
    // 问题1: 检查自动同步
    console.log('\n1️⃣ 检查自动同步问题...');
    const bookmarkManager = new BookmarkManager();
    
    try {
        const paths = await bookmarkManager.detectBrowserPaths();
        
        if (paths.chrome && paths.atlas) {
            console.log('✅ 浏览器路径检测正常');
            
            // 检查文件权限
            const chromeStats = await fs.stat(paths.chrome);
            const atlasStats = await fs.stat(paths.atlas);
            
            console.log(`Chrome 文件: ${chromeStats.size} 字节, 修改时间: ${chromeStats.mtime.toLocaleString('zh-CN')}`);
            console.log(`Atlas 文件: ${atlasStats.size} 字节, 修改时间: ${atlasStats.mtime.toLocaleString('zh-CN')}`);
            
            // 测试实际同步
            console.log('\n🧪 测试实际同步功能...');
            const syncResult = await bookmarkManager.syncBookmarks({
                chromePath: paths.chrome,
                atlasPath: paths.atlas,
                syncDirection: 'bidirectional'
            });
            
            console.log('同步结果:');
            console.log(`- Chrome 更新: ${syncResult.chromeUpdated}`);
            console.log(`- Atlas 更新: ${syncResult.atlasUpdated}`);
            console.log(`- 总同步数: ${syncResult.syncedItems.totalSynced}`);
            console.log(`- 时间戳: Chrome(${syncResult.fileModTimes.chrome}) Atlas(${syncResult.fileModTimes.atlas})`);
            
            if (syncResult.syncedItems.addedToChrome.length > 0) {
                console.log(`- 向Chrome添加: ${syncResult.syncedItems.addedToChrome.length} 个`);
            }
            if (syncResult.syncedItems.addedToAtlas.length > 0) {
                console.log(`- 向Atlas添加: ${syncResult.syncedItems.addedToAtlas.length} 个`);
            }
            if (syncResult.syncedItems.removedFromChrome && syncResult.syncedItems.removedFromChrome.length > 0) {
                console.log(`- 从Chrome删除: ${syncResult.syncedItems.removedFromChrome.length} 个`);
            }
            if (syncResult.syncedItems.removedFromAtlas && syncResult.syncedItems.removedFromAtlas.length > 0) {
                console.log(`- 从Atlas删除: ${syncResult.syncedItems.removedFromAtlas.length} 个`);
            }
            
        } else {
            console.log('❌ 浏览器路径检测失败');
        }
        
    } catch (error) {
        console.log(`❌ 自动同步检查失败: ${error.message}`);
    }
    
    // 问题2: 检查删除同步
    console.log('\n2️⃣ 检查删除同步问题...');
    try {
        // 创建测试数据来验证删除逻辑
        const testChrome = {
            roots: {
                bookmark_bar: {
                    children: [
                        { type: 'url', name: 'Test1', url: 'https://test1.com', date_added: '1000' },
                        { type: 'url', name: 'Test2', url: 'https://test2.com', date_added: '2000' },
                        { type: 'url', name: 'ToDelete', url: 'https://delete.com', date_added: '3000' }
                    ]
                },
                other: { children: [] }
            }
        };
        
        const testAtlas = {
            roots: {
                bookmark_bar: {
                    children: [
                        { type: 'url', name: 'Test1', url: 'https://test1.com', date_added: '1000' },
                        { type: 'url', name: 'Test2', url: 'https://test2.com', date_added: '2000' }
                        // ToDelete 被删除了
                    ]
                },
                other: { children: [] }
            }
        };
        
        // Atlas更新时间更新 (删除操作)
        const merged = await bookmarkManager.mergeBookmarks(testChrome, testAtlas, 1000, 2000);
        const hasDeleted = !merged.roots.bookmark_bar.children.some(b => b.name === 'ToDelete');
        
        console.log(`删除同步逻辑: ${hasDeleted ? '✅ 正常' : '❌ 异常'}`);
        console.log(`合并后书签数量: ${merged.roots.bookmark_bar.children.length}`);
        
    } catch (error) {
        console.log(`❌ 删除同步检查失败: ${error.message}`);
    }
    
    // 问题3: 检查Atlas重启
    console.log('\n3️⃣ 检查Atlas重启问题...');
    try {
        const atlasHelper = new AtlasRestartHelper();
        
        const isRunning = await atlasHelper.isAtlasRunning();
        console.log(`Atlas 运行状态: ${isRunning ? '✅ 运行中' : '❌ 未运行'}`);
        
        if (isRunning) {
            console.log('🔄 测试重启功能...');
            const restartResult = await atlasHelper.restartAtlas();
            console.log(`重启结果: ${restartResult.success ? '✅ 成功' : '❌ 失败'}`);
            if (!restartResult.success) {
                console.log(`重启错误: ${restartResult.message}`);
            }
        }
        
    } catch (error) {
        console.log(`❌ Atlas重启检查失败: ${error.message}`);
    }
    
    // 总结和建议
    console.log('\n🎯 问题总结和建议:');
    console.log('=' .repeat(50));
    console.log('1. 自动同步问题可能原因:');
    console.log('   - 浏览器书签文件写入延迟');
    console.log('   - 文件监控配置需要调整');
    console.log('   - 需要增加轮询机制作为备选');
    
    console.log('\n2. 删除同步问题可能原因:');
    console.log('   - 实际文件时间戳获取问题');
    console.log('   - 需要验证真实场景下的行为');
    
    console.log('\n3. Atlas重启问题可能原因:');
    console.log('   - IPC通信问题');
    console.log('   - 需要检查应用中的错误处理');
    
    console.log('\n💡 建议修复方案:');
    console.log('1. 增加文件监控的轮询模式');
    console.log('2. 改进错误处理和日志记录');
    console.log('3. 添加调试模式和详细日志');
    console.log('4. 优化IPC通信的错误处理');
}

// 运行修复诊断
fixIssues().then(() => {
    console.log('\n🏁 问题诊断完成');
}).catch(error => {
    console.error('❌ 诊断失败:', error.message);
});