#!/usr/bin/env node

console.log('🐛 测试合并逻辑Bug...\n');

// 模拟书签数据
const chromeBookmarks = {
    roots: {
        bookmark_bar: {
            children: [
                { type: 'url', name: 'Google', url: 'https://google.com' },
                { type: 'url', name: 'GitHub', url: 'https://github.com' },
                { type: 'url', name: 'New Bookmark', url: 'https://github.com/DayuanJiang/next-ai-draw-io' } // Chrome独有
            ]
        },
        other: {
            children: []
        }
    }
};

const atlasBookmarks = {
    roots: {
        bookmark_bar: {
            children: [
                { type: 'url', name: 'Google', url: 'https://google.com' },
                { type: 'url', name: 'GitHub', url: 'https://github.com' }
                // 缺少 New Bookmark
            ]
        },
        other: {
            children: []
        }
    }
};

// 模拟 mergeBookmarks 函数
function mergeBookmarks(source, target) {
    const merged = { ...target };
    
    if (source.roots && target.roots) {
        if (source.roots.bookmark_bar && target.roots.bookmark_bar) {
            merged.roots.bookmark_bar.children = mergeBookmarkNodes(
                source.roots.bookmark_bar.children || [],
                target.roots.bookmark_bar.children || []
            );
        }
        
        if (source.roots.other && target.roots.other) {
            merged.roots.other.children = mergeBookmarkNodes(
                source.roots.other.children || [],
                target.roots.other.children || []
            );
        }
    }
    
    return merged;
}

function mergeBookmarkNodes(sourceNodes, targetNodes) {
    const merged = [...targetNodes];
    const targetUrls = new Set(targetNodes.filter(n => n.url).map(n => n.url));

    for (const sourceNode of sourceNodes) {
        if (sourceNode.url && !targetUrls.has(sourceNode.url)) {
            merged.push(sourceNode);
        }
    }

    return merged;
}

console.log('📊 测试场景:');
console.log('Chrome 书签数量:', chromeBookmarks.roots.bookmark_bar.children.length);
console.log('Atlas 书签数量:', atlasBookmarks.roots.bookmark_bar.children.length);

console.log('\n🔄 执行合并...');
const mergedBookmarks = mergeBookmarks(chromeBookmarks, atlasBookmarks);

console.log('合并后书签数量:', mergedBookmarks.roots.bookmark_bar.children.length);

console.log('\n🔍 检查变化检测逻辑:');
const chromeChanged = JSON.stringify(chromeBookmarks) !== JSON.stringify(mergedBookmarks);
const atlasChanged = JSON.stringify(atlasBookmarks) !== JSON.stringify(mergedBookmarks);

console.log('Chrome 原始:', JSON.stringify(chromeBookmarks).length, '字符');
console.log('Atlas 原始:', JSON.stringify(atlasBookmarks).length, '字符');
console.log('合并结果:', JSON.stringify(mergedBookmarks).length, '字符');

console.log(`\nChrome 需要更新: ${chromeChanged ? '是' : '否'}`);
console.log(`Atlas 需要更新: ${atlasChanged ? '是' : '否'}`);

console.log('\n🐛 问题分析:');
if (!atlasChanged) {
    console.log('❌ Bug发现！Atlas应该被更新但检测为不需要更新');
    console.log('原因: mergeBookmarks以Atlas为基础(target)，添加Chrome独有书签');
    console.log('结果: 合并结果与Atlas原始数据不同，但检测逻辑有误');
    
    console.log('\n🔧 正确的检测逻辑应该是:');
    console.log('- 如果Chrome独有书签 > 0，Atlas需要更新');
    console.log('- 如果Atlas独有书签 > 0，Chrome需要更新');
    console.log('- 不应该依赖JSON字符串比较');
} else {
    console.log('✅ 检测逻辑正确');
}

console.log('\n📝 合并后的书签:');
mergedBookmarks.roots.bookmark_bar.children.forEach((bookmark, index) => {
    console.log(`${index + 1}. ${bookmark.name} - ${bookmark.url}`);
});