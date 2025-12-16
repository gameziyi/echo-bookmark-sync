#!/usr/bin/env node

const chokidar = require('chokidar');
const BookmarkManager = require('./src/bookmark-manager');
const fs = require('fs-extra');

console.log('🔍 调试自动同步问题...\n');

async function debugAutoSync() {
    const bookmarkManager = new BookmarkManager();
    
    try {
        // 1. 检测浏览器路径
        console.log('📂 检测浏览器路径...');
        const paths = await bookmarkManager.detectBrowserPaths();
        console.log('Chrome 路径:', paths.chrome || '❌ 未找到');
        console.log('Atlas 路径:', paths.atlas || '❌ 未找到');
        
        if (!paths.chrome || !paths.atlas) {
            console.log('\n❌ 路径检测失败，无法继续调试');
            return;
        }
        
        // 2. 检查文件是否存在
        console.log('\n📋 检查文件状态...');
        const chromeExists = await fs.pathExists(paths.chrome);
        const atlasExists = await fs.pathExists(paths.atlas);
        
        console.log(`Chrome 文件存在: ${chromeExists ? '✅' : '❌'}`);
        console.log(`Atlas 文件存在: ${atlasExists ? '✅' : '❌'}`);
        
        if (!chromeExists || !atlasExists) {
            console.log('\n❌ 书签文件不存在，无法监控');
            return;
        }
        
        // 3. 测试文件监控
        console.log('\n👀 开始监控文件变化...');
        console.log('请在浏览器中添加或删除书签来测试监控功能');
        console.log('按 Ctrl+C 停止监控\n');
        
        const pathsToWatch = [
            { path: paths.chrome, browser: 'Chrome' },
            { path: paths.atlas, browser: 'Atlas' }
        ];
        
        const watchers = [];
        
        for (const { path: filePath, browser } of pathsToWatch) {
            console.log(`🔍 监控 ${browser}: ${filePath}`);
            
            const watcher = chokidar.watch(filePath, {
                persistent: true,
                ignoreInitial: true,
                usePolling: false, // 尝试不使用轮询
                interval: 1000,
                binaryInterval: 1000
            });
            
            watcher.on('change', async (path) => {
                console.log(`\n🔄 检测到 ${browser} 文件变化: ${new Date().toLocaleTimeString('zh-CN')}`);
                console.log(`文件路径: ${path}`);
                
                try {
                    // 读取文件统计信息
                    const stats = await fs.stat(path);
                    console.log(`文件大小: ${stats.size} 字节`);
                    console.log(`修改时间: ${stats.mtime.toLocaleString('zh-CN')}`);
                    
                    // 尝试读取书签
                    const bookmarks = await bookmarkManager.readBookmarks(path);
                    const bookmarkCount = bookmarkManager.analyzeBookmarks(bookmarks).totalBookmarks;
                    console.log(`书签数量: ${bookmarkCount} 个`);
                    
                    console.log('✅ 文件监控正常工作');
                    
                } catch (error) {
                    console.log(`❌ 处理文件变化时出错: ${error.message}`);
                }
            });
            
            watcher.on('error', (error) => {
                console.log(`❌ ${browser} 监控出错: ${error.message}`);
            });
            
            watcher.on('ready', () => {
                console.log(`✅ ${browser} 监控已就绪`);
            });
            
            watchers.push(watcher);
        }
        
        // 4. 测试手动同步
        console.log('\n🧪 测试手动同步功能...');
        try {
            const syncResult = await bookmarkManager.syncBookmarks({
                chromePath: paths.chrome,
                atlasPath: paths.atlas,
                syncDirection: 'bidirectional'
            });
            
            console.log('✅ 手动同步测试成功');
            console.log(`Chrome 更新: ${syncResult.chromeUpdated}`);
            console.log(`Atlas 更新: ${syncResult.atlasUpdated}`);
            console.log(`同步总数: ${syncResult.syncedItems.totalSynced}`);
            
        } catch (error) {
            console.log(`❌ 手动同步测试失败: ${error.message}`);
        }
        
        // 保持监控运行
        process.on('SIGINT', () => {
            console.log('\n\n🛑 停止监控...');
            watchers.forEach(watcher => watcher.close());
            process.exit(0);
        });
        
    } catch (error) {
        console.error('❌ 调试过程出错:', error.message);
        console.error(error.stack);
    }
}

// 运行调试
debugAutoSync().catch(console.error);