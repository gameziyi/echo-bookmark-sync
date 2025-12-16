#!/usr/bin/env node

const BookmarkManager = require('./src/bookmark-manager');
const fs = require('fs-extra');
const path = require('path');

console.log('🔍 诊断同步失败问题...\n');

async function diagnoseSyncIssue() {
    const bookmarkManager = new BookmarkManager();
    
    try {
        // 1. 检测浏览器路径
        console.log('📂 检测浏览器路径...');
        const paths = await bookmarkManager.detectBrowserPaths();
        console.log('Chrome 路径:', paths.chrome || '❌ 未找到');
        console.log('Atlas 路径:', paths.atlas || '❌ 未找到');
        
        if (!paths.chrome || !paths.atlas) {
            console.log('\n❌ 路径检测失败，无法继续诊断');
            return;
        }
        
        // 2. 检查文件是否存在和可读
        console.log('\n📋 检查书签文件状态...');
        
        const chromeExists = await fs.pathExists(paths.chrome);
        const atlasExists = await fs.pathExists(paths.atlas);
        
        console.log(`Chrome 文件存在: ${chromeExists ? '✅' : '❌'}`);
        console.log(`Atlas 文件存在: ${atlasExists ? '✅' : '❌'}`);
        
        if (!chromeExists || !atlasExists) {
            console.log('\n❌ 书签文件不存在，无法同步');
            return;
        }
        
        // 3. 检查文件权限
        console.log('\n🔐 检查文件权限...');
        try {
            const chromeStats = await fs.stat(paths.chrome);
            const atlasStats = await fs.stat(paths.atlas);
            
            console.log(`Chrome 文件大小: ${chromeStats.size} 字节`);
            console.log(`Atlas 文件大小: ${atlasStats.size} 字节`);
            console.log(`Chrome 最后修改: ${chromeStats.mtime.toLocaleString('zh-CN')}`);
            console.log(`Atlas 最后修改: ${atlasStats.mtime.toLocaleString('zh-CN')}`);
        } catch (error) {
            console.log(`❌ 文件权限检查失败: ${error.message}`);
        }
        
        // 4. 尝试读取书签文件
        console.log('\n📖 尝试读取书签文件...');
        let chromeBookmarks, atlasBookmarks;
        
        try {
            chromeBookmarks = await bookmarkManager.readBookmarks(paths.chrome);
            console.log('✅ Chrome 书签读取成功');
        } catch (error) {
            console.log(`❌ Chrome 书签读取失败: ${error.message}`);
            return;
        }
        
        try {
            atlasBookmarks = await bookmarkManager.readBookmarks(paths.atlas);
            console.log('✅ Atlas 书签读取成功');
        } catch (error) {
            console.log(`❌ Atlas 书签读取失败: ${error.message}`);
            return;
        }
        
        // 5. 分析书签差异
        console.log('\n🔍 分析书签差异...');
        const comparison = bookmarkManager.compareBookmarks(chromeBookmarks, atlasBookmarks);
        
        console.log(`Chrome 总书签: ${comparison.chromeStats.totalBookmarks} 个`);
        console.log(`Atlas 总书签: ${comparison.atlasStats.totalBookmarks} 个`);
        console.log(`Chrome 独有: ${comparison.differences.onlyInChrome.length} 个`);
        console.log(`Atlas 独有: ${comparison.differences.onlyInAtlas.length} 个`);
        console.log(`共同书签: ${comparison.differences.common.length} 个`);
        
        if (comparison.differences.needsSync) {
            console.log('\n📝 需要同步的书签:');
            
            if (comparison.differences.onlyInChrome.length > 0) {
                console.log('\n📱 Chrome 独有书签:');
                comparison.differences.onlyInChrome.slice(0, 3).forEach((bookmark, index) => {
                    console.log(`   ${index + 1}. ${bookmark.name}`);
                    console.log(`      URL: ${bookmark.url}`);
                });
                if (comparison.differences.onlyInChrome.length > 3) {
                    console.log(`   ... 还有 ${comparison.differences.onlyInChrome.length - 3} 个`);
                }
            }
            
            if (comparison.differences.onlyInAtlas.length > 0) {
                console.log('\n🌐 Atlas 独有书签:');
                comparison.differences.onlyInAtlas.slice(0, 3).forEach((bookmark, index) => {
                    console.log(`   ${index + 1}. ${bookmark.name}`);
                    console.log(`      URL: ${bookmark.url}`);
                });
                if (comparison.differences.onlyInAtlas.length > 3) {
                    console.log(`   ... 还有 ${comparison.differences.onlyInAtlas.length - 3} 个`);
                }
            }
        } else {
            console.log('\n✅ 书签已同步，无需更新');
        }
        
        // 6. 尝试执行同步
        console.log('\n🔄 尝试执行同步...');
        try {
            const syncResult = await bookmarkManager.syncBookmarks({
                chromePath: paths.chrome,
                atlasPath: paths.atlas,
                syncDirection: 'bidirectional'
            });
            
            console.log('✅ 同步执行成功');
            console.log(`Chrome 更新: ${syncResult.chromeUpdated ? '是' : '否'}`);
            console.log(`Atlas 更新: ${syncResult.atlasUpdated ? '是' : '否'}`);
            console.log(`同步总数: ${syncResult.syncedItems.totalSynced} 个`);
            
            if (syncResult.syncedItems.addedToChrome.length > 0) {
                console.log(`向 Chrome 添加: ${syncResult.syncedItems.addedToChrome.length} 个`);
            }
            if (syncResult.syncedItems.addedToAtlas.length > 0) {
                console.log(`向 Atlas 添加: ${syncResult.syncedItems.addedToAtlas.length} 个`);
            }
            
        } catch (error) {
            console.log(`❌ 同步执行失败: ${error.message}`);
            console.log('错误详情:', error);
        }
        
        // 7. 检查同步后的状态
        console.log('\n🔍 检查同步后状态...');
        try {
            const afterChromeBookmarks = await bookmarkManager.readBookmarks(paths.chrome);
            const afterAtlasBookmarks = await bookmarkManager.readBookmarks(paths.atlas);
            const afterComparison = bookmarkManager.compareBookmarks(afterChromeBookmarks, afterAtlasBookmarks);
            
            console.log(`同步后 Chrome 总书签: ${afterComparison.chromeStats.totalBookmarks} 个`);
            console.log(`同步后 Atlas 总书签: ${afterComparison.atlasStats.totalBookmarks} 个`);
            console.log(`同步后差异: ${afterComparison.differences.needsSync ? '仍有差异' : '已同步'}`);
            
        } catch (error) {
            console.log(`❌ 同步后检查失败: ${error.message}`);
        }
        
    } catch (error) {
        console.log(`❌ 诊断过程出错: ${error.message}`);
        console.log('错误详情:', error);
    }
}

// 运行诊断
diagnoseSyncIssue().then(() => {
    console.log('\n🏁 诊断完成');
}).catch(error => {
    console.log(`❌ 诊断失败: ${error.message}`);
});