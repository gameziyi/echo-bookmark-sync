#!/usr/bin/env node

const chokidar = require('chokidar');
const BookmarkManager = require('./src/bookmark-manager');
const fs = require('fs-extra');

console.log('🧪 测试修复效果...\n');

async function testFixes() {
    const bookmarkManager = new BookmarkManager();
    
    try {
        // 获取路径
        const paths = await bookmarkManager.detectBrowserPaths();
        
        if (!paths.chrome || !paths.atlas) {
            console.log('❌ 无法获取浏览器路径');
            return;
        }
        
        console.log('📂 浏览器路径:');
        console.log(`Chrome: ${paths.chrome}`);
        console.log(`Atlas: ${paths.atlas}`);
        
        // 测试改进的文件监控
        console.log('\n👀 测试改进的文件监控 (轮询模式)...');
        
        const pathsToWatch = [
            { path: paths.chrome, browser: 'Chrome' },
            { path: paths.atlas, browser: 'Atlas' }
        ];
        
        const watchers = [];
        
        for (const { path: filePath, browser } of pathsToWatch) {
            const watcher = chokidar.watch(filePath, {
                persistent: true,
                ignoreInitial: true,
                usePolling: true,  // 使用轮询模式
                interval: 2000,    // 每2秒检查一次
                binaryInterval: 2000
            });
            
            watcher.on('change', async () => {
                console.log(`\n🔄 检测到 ${browser} 文件变化: ${new Date().toLocaleTimeString('zh-CN')}`);
                
                try {
                    // 等待文件写入完成
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    const stats = await fs.stat(filePath);
                    console.log(`📊 文件大小: ${stats.size} 字节`);
                    console.log(`📅 修改时间: ${stats.mtime.toLocaleString('zh-CN')}`);
                    
                    // 读取书签并分析
                    const bookmarks = await bookmarkManager.readBookmarks(filePath);
                    const analysis = bookmarkManager.analyzeBookmarks(bookmarks);
                    console.log(`📚 书签数量: ${analysis.totalBookmarks} 个`);
                    
                    // 执行同步
                    const syncResult = await bookmarkManager.syncBookmarks({
                        chromePath: paths.chrome,
                        atlasPath: paths.atlas,
                        syncDirection: 'bidirectional'
                    });
                    
                    console.log('🔄 同步结果:');
                    console.log(`   Chrome 更新: ${syncResult.chromeUpdated}`);
                    console.log(`   Atlas 更新: ${syncResult.atlasUpdated}`);
                    console.log(`   总同步数: ${syncResult.syncedItems.totalSynced}`);
                    
                    if (syncResult.syncedItems.addedToChrome.length > 0) {
                        console.log(`   ➕ 向Chrome添加: ${syncResult.syncedItems.addedToChrome.length} 个`);
                    }
                    if (syncResult.syncedItems.addedToAtlas.length > 0) {
                        console.log(`   ➕ 向Atlas添加: ${syncResult.syncedItems.addedToAtlas.length} 个`);
                    }
                    if (syncResult.syncedItems.removedFromChrome && syncResult.syncedItems.removedFromChrome.length > 0) {
                        console.log(`   ➖ 从Chrome删除: ${syncResult.syncedItems.removedFromChrome.length} 个`);
                    }
                    if (syncResult.syncedItems.removedFromAtlas && syncResult.syncedItems.removedFromAtlas.length > 0) {
                        console.log(`   ➖ 从Atlas删除: ${syncResult.syncedItems.removedFromAtlas.length} 个`);
                    }
                    
                    console.log('✅ 自动同步测试成功');
                    
                } catch (error) {
                    console.log(`❌ 处理变化时出错: ${error.message}`);
                }
            });
            
            watcher.on('error', (error) => {
                console.log(`❌ ${browser} 监控错误: ${error.message}`);
            });
            
            watcher.on('ready', () => {
                console.log(`✅ ${browser} 监控已就绪 (轮询模式)`);
            });
            
            watchers.push(watcher);
        }
        
        console.log('\n💡 测试说明:');
        console.log('1. 现在使用轮询模式监控文件变化，更可靠');
        console.log('2. 增加了1秒延迟确保文件写入完成');
        console.log('3. 添加了详细的调试日志');
        console.log('4. 请在浏览器中添加或删除书签来测试');
        console.log('5. 按 Ctrl+C 停止测试');
        
        // 保持监控运行
        process.on('SIGINT', () => {
            console.log('\n\n🛑 停止测试...');
            watchers.forEach(watcher => watcher.close());
            process.exit(0);
        });
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
    }
}

// 运行测试
testFixes().catch(console.error);