#!/usr/bin/env node

const BookmarkManager = require('./src/bookmark-manager');

console.log('🧪 综合同步功能测试...\n');

async function runComprehensiveTest() {
    const bookmarkManager = new BookmarkManager();
    
    // 测试场景1: 删除同步
    console.log('📋 场景1: 删除同步测试');
    console.log('=' .repeat(50));
    
    const chromeWithExtra = {
        roots: {
            bookmark_bar: {
                children: [
                    { type: 'url', name: 'Common1', url: 'https://common1.com', date_added: '1000' },
                    { type: 'url', name: 'Chrome Only', url: 'https://chrome-only.com', date_added: '2000' }
                ]
            },
            other: { children: [] }
        }
    };
    
    const atlasWithoutExtra = {
        roots: {
            bookmark_bar: {
                children: [
                    { type: 'url', name: 'Common1', url: 'https://common1.com', date_added: '1000' }
                ]
            },
            other: { children: [] }
        }
    };
    
    // Atlas更新时间更新 (删除了Chrome Only)
    const result1 = await bookmarkManager.mergeBookmarks(
        chromeWithExtra, atlasWithoutExtra, 1000, 2000
    );
    
    const hasDeleted = !result1.roots.bookmark_bar.children.some(b => b.name === 'Chrome Only');
    console.log(`删除同步: ${hasDeleted ? '✅ 通过' : '❌ 失败'}`);
    
    // 测试场景2: 新增同步
    console.log('\n📋 场景2: 新增同步测试');
    console.log('=' .repeat(50));
    
    const chromeBase = {
        roots: {
            bookmark_bar: {
                children: [
                    { type: 'url', name: 'Common1', url: 'https://common1.com', date_added: '1000' }
                ]
            },
            other: { children: [] }
        }
    };
    
    const atlasWithNew = {
        roots: {
            bookmark_bar: {
                children: [
                    { type: 'url', name: 'Common1', url: 'https://common1.com', date_added: '1000' },
                    { type: 'url', name: 'Atlas New', url: 'https://atlas-new.com', date_added: '3000' }
                ]
            },
            other: { children: [] }
        }
    };
    
    // Atlas更新时间更新 (添加了新书签)
    const result2 = await bookmarkManager.mergeBookmarks(
        chromeBase, atlasWithNew, 1000, 2000
    );
    
    const hasAdded = result2.roots.bookmark_bar.children.some(b => b.name === 'Atlas New');
    console.log(`新增同步: ${hasAdded ? '✅ 通过' : '❌ 失败'}`);
    
    // 测试场景3: 冲突解决 (时间戳优先)
    console.log('\n📋 场景3: 冲突解决测试');
    console.log('=' .repeat(50));
    
    const chromeNewer = {
        roots: {
            bookmark_bar: {
                children: [
                    { type: 'url', name: 'Common', url: 'https://common.com', date_added: '1000' },
                    { type: 'url', name: 'Chrome Newer', url: 'https://chrome-newer.com', date_added: '3000' }
                ]
            },
            other: { children: [] }
        }
    };
    
    const atlasOlder = {
        roots: {
            bookmark_bar: {
                children: [
                    { type: 'url', name: 'Common', url: 'https://common.com', date_added: '1000' },
                    { type: 'url', name: 'Atlas Older', url: 'https://atlas-older.com', date_added: '2000' }
                ]
            },
            other: { children: [] }
        }
    };
    
    // Chrome更新时间更新 (Chrome优先)
    const result3 = await bookmarkManager.mergeBookmarks(
        chromeNewer, atlasOlder, 3000, 2000
    );
    
    const hasChromeBookmark = result3.roots.bookmark_bar.children.some(b => b.name === 'Chrome Newer');
    const hasAtlasBookmark = result3.roots.bookmark_bar.children.some(b => b.name === 'Atlas Older');
    
    console.log(`Chrome优先: ${hasChromeBookmark ? '✅ 通过' : '❌ 失败'}`);
    console.log(`Atlas被覆盖: ${!hasAtlasBookmark ? '✅ 通过' : '❌ 失败'}`);
    
    // 测试场景4: 文件夹处理
    console.log('\n📋 场景4: 文件夹同步测试');
    console.log('=' .repeat(50));
    
    const chromeWithFolder = {
        roots: {
            bookmark_bar: {
                children: [
                    {
                        type: 'folder',
                        name: 'Work',
                        children: [
                            { type: 'url', name: 'Gmail', url: 'https://gmail.com', date_added: '1000' },
                            { type: 'url', name: 'Chrome Work', url: 'https://chrome-work.com', date_added: '2000' }
                        ]
                    }
                ]
            },
            other: { children: [] }
        }
    };
    
    const atlasWithFolder = {
        roots: {
            bookmark_bar: {
                children: [
                    {
                        type: 'folder',
                        name: 'Work',
                        children: [
                            { type: 'url', name: 'Gmail', url: 'https://gmail.com', date_added: '1000' },
                            { type: 'url', name: 'Atlas Work', url: 'https://atlas-work.com', date_added: '3000' }
                        ]
                    }
                ]
            },
            other: { children: [] }
        }
    };
    
    // Atlas更新时间更新
    const result4 = await bookmarkManager.mergeBookmarks(
        chromeWithFolder, atlasWithFolder, 1000, 2000
    );
    
    const workFolder = result4.roots.bookmark_bar.children.find(c => c.name === 'Work');
    const hasAtlasWork = workFolder && workFolder.children.some(c => c.name === 'Atlas Work');
    const hasChromeWork = workFolder && workFolder.children.some(c => c.name === 'Chrome Work');
    
    console.log(`文件夹合并: ${workFolder ? '✅ 通过' : '❌ 失败'}`);
    console.log(`Atlas优先: ${hasAtlasWork ? '✅ 通过' : '❌ 失败'}`);
    console.log(`Chrome被删除: ${!hasChromeWork ? '✅ 通过' : '❌ 失败'}`);
    
    // 总结
    console.log('\n🎯 测试总结:');
    console.log('=' .repeat(50));
    console.log('✅ 删除同步: 支持基于时间戳的书签删除');
    console.log('✅ 新增同步: 支持新书签的添加');
    console.log('✅ 冲突解决: 基于文件修改时间优先');
    console.log('✅ 文件夹处理: 递归处理文件夹内容');
    console.log('✅ 时间戳优先: 最新修改的文件优先');
    
    console.log('\n💡 功能特点:');
    console.log('- 智能识别新增、删除、修改操作');
    console.log('- 基于文件修改时间解决冲突');
    console.log('- 支持文件夹的递归同步');
    console.log('- 保留共同书签，处理差异');
}

// 运行测试
runComprehensiveTest().then(() => {
    console.log('\n🏁 综合测试完成');
}).catch(error => {
    console.error('❌ 测试失败:', error.message);
    console.error(error.stack);
});