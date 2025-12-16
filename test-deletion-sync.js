#!/usr/bin/env node

const BookmarkManager = require('./src/bookmark-manager');
const fs = require('fs-extra');

console.log('🧪 测试删除同步功能...\n');

async function testDeletionSync() {
    const bookmarkManager = new BookmarkManager();
    
    // 创建测试书签数据
    const chromeBookmarks = {
        roots: {
            bookmark_bar: {
                children: [
                    { type: 'url', name: 'Google', url: 'https://google.com', date_added: '1000' },
                    { type: 'url', name: 'GitHub', url: 'https://github.com', date_added: '2000' },
                    { type: 'url', name: 'Test Bookmark', url: 'https://test.com', date_added: '3000' }
                ]
            },
            other: { children: [] }
        }
    };
    
    const atlasBookmarks = {
        roots: {
            bookmark_bar: {
                children: [
                    { type: 'url', name: 'Google', url: 'https://google.com', date_added: '1000' },
                    { type: 'url', name: 'GitHub', url: 'https://github.com', date_added: '2000' }
                    // 注意: Test Bookmark 在Atlas中被删除了
                ]
            },
            other: { children: [] }
        }
    };
    
    console.log('📋 测试场景:');
    console.log('Chrome 书签: Google, GitHub, Test Bookmark (3个)');
    console.log('Atlas 书签: Google, GitHub (2个)');
    console.log('预期: Test Bookmark 应该被从Chrome中删除 (假设Atlas更新)\n');
    
    // 模拟Atlas文件更新时间更新
    const chromeModTime = 1000;
    const atlasModTime = 2000; // Atlas更新
    
    console.log('⏰ 时间戳:');
    console.log(`Chrome: ${chromeModTime} (旧)`);
    console.log(`Atlas: ${atlasModTime} (新) ← 优先`);
    
    try {
        // 测试智能合并
        const mergedBookmarks = await bookmarkManager.mergeBookmarks(
            chromeBookmarks,
            atlasBookmarks,
            chromeModTime,
            atlasModTime
        );
        
        console.log('\n🔄 合并结果:');
        const mergedCount = mergedBookmarks.roots.bookmark_bar.children.length;
        console.log(`合并后书签数量: ${mergedCount}`);
        
        console.log('\n📝 合并后的书签:');
        mergedBookmarks.roots.bookmark_bar.children.forEach((bookmark, index) => {
            console.log(`${index + 1}. ${bookmark.name} - ${bookmark.url}`);
        });
        
        // 验证结果
        const hasTestBookmark = mergedBookmarks.roots.bookmark_bar.children.some(
            b => b.name === 'Test Bookmark'
        );
        
        console.log('\n✅ 测试结果:');
        if (!hasTestBookmark && mergedCount === 2) {
            console.log('🎉 删除同步测试通过！');
            console.log('- Test Bookmark 被正确删除');
            console.log('- 基于Atlas更新时间优先');
            console.log('- 保留了共同的书签');
        } else {
            console.log('❌ 删除同步测试失败！');
            console.log(`- 预期: 2个书签，实际: ${mergedCount}个`);
            console.log(`- Test Bookmark 存在: ${hasTestBookmark}`);
        }
        
        // 测试比较功能
        console.log('\n🔍 测试书签比较:');
        const comparison = bookmarkManager.compareBookmarks(chromeBookmarks, mergedBookmarks);
        console.log(`Chrome独有: ${comparison.differences.onlyInChrome.length} 个`);
        console.log(`合并结果独有: ${comparison.differences.onlyInAtlas.length} 个`);
        
        if (comparison.differences.onlyInChrome.length === 1) {
            const removed = comparison.differences.onlyInChrome[0];
            console.log(`被删除的书签: ${removed.name} - ${removed.url}`);
        }
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        console.error(error.stack);
    }
}

// 运行测试
testDeletionSync().then(() => {
    console.log('\n🏁 删除同步测试完成');
}).catch(error => {
    console.error('❌ 测试运行失败:', error.message);
});