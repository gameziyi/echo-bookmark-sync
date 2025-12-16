const BookmarkManager = require('./src/bookmark-manager');
const fs = require('fs-extra');

async function diagnoseSyncIssue() {
    console.log('🔍 诊断同步问题...\n');
    
    const manager = new BookmarkManager();
    
    // 1. 获取路径
    console.log('1️⃣ 检查路径');
    console.log('=' .repeat(50));
    
    const paths = await manager.detectBrowserPaths();
    console.log('Chrome 路径:', paths.chrome);
    console.log('Atlas 路径:', paths.atlas);
    
    if (!paths.chrome || !paths.atlas) {
        console.log('❌ 路径检测失败，无法继续诊断');
        return;
    }
    
    // 2. 检查文件状态
    console.log('\n2️⃣ 检查文件状态');
    console.log('=' .repeat(50));
    
    const chromeStats = await fs.stat(paths.chrome);
    const atlasStats = await fs.stat(paths.atlas);
    
    console.log('Chrome 文件:');
    console.log('  大小:', (chromeStats.size / 1024).toFixed(2), 'KB');
    console.log('  修改时间:', chromeStats.mtime.toLocaleString());
    
    console.log('Atlas 文件:');
    console.log('  大小:', (atlasStats.size / 1024).toFixed(2), 'KB');
    console.log('  修改时间:', atlasStats.mtime.toLocaleString());
    
    // 3. 读取书签内容
    console.log('\n3️⃣ 读取书签内容');
    console.log('=' .repeat(50));
    
    const chromeBookmarks = await manager.readBookmarks(paths.chrome);
    const atlasBookmarks = await manager.readBookmarks(paths.atlas);
    
    const chromeCount = chromeBookmarks.roots.bookmark_bar.children?.length || 0;
    const atlasCount = atlasBookmarks.roots.bookmark_bar.children?.length || 0;
    
    console.log('Chrome 书签栏数量:', chromeCount);
    console.log('Atlas 书签栏数量:', atlasCount);
    
    // 4. 显示前几个书签进行对比
    console.log('\n4️⃣ 书签内容对比');
    console.log('=' .repeat(50));
    
    console.log('Chrome 前5个书签:');
    chromeBookmarks.roots.bookmark_bar.children?.slice(0, 5).forEach((bookmark, i) => {
        console.log(`  ${i+1}. ${bookmark.name} - ${bookmark.url}`);
    });
    
    console.log('\nAtlas 前5个书签:');
    atlasBookmarks.roots.bookmark_bar.children?.slice(0, 5).forEach((bookmark, i) => {
        console.log(`  ${i+1}. ${bookmark.name} - ${bookmark.url}`);
    });
    
    // 5. 检查 Atlas 浏览器是否正在运行
    console.log('\n5️⃣ 检查 Atlas 浏览器状态');
    console.log('=' .repeat(50));
    
    try {
        const { execSync } = require('child_process');
        const atlasProcesses = execSync('ps aux | grep -i atlas | grep -v grep', { encoding: 'utf8' });
        
        if (atlasProcesses.trim()) {
            console.log('⚠️  Atlas 浏览器正在运行！');
            console.log('这可能导致书签文件被浏览器覆盖。');
            console.log('建议：关闭 Atlas 浏览器后再进行同步。');
        } else {
            console.log('✅ Atlas 浏览器未运行');
        }
    } catch (e) {
        console.log('无法检查 Atlas 进程状态');
    }
    
    // 6. 测试写入权限
    console.log('\n6️⃣ 测试文件写入权限');
    console.log('=' .repeat(50));
    
    try {
        const testPath = paths.atlas + '.test';
        await fs.writeFile(testPath, 'test');
        await fs.remove(testPath);
        console.log('✅ Atlas 文件写入权限正常');
    } catch (error) {
        console.log('❌ Atlas 文件写入权限问题:', error.message);
    }
    
    // 7. 检查备份文件
    console.log('\n7️⃣ 检查备份文件');
    console.log('=' .repeat(50));
    
    const atlasDir = require('path').dirname(paths.atlas);
    const files = await fs.readdir(atlasDir);
    const backupFiles = files.filter(f => f.includes('backup'));
    
    console.log('备份文件数量:', backupFiles.length);
    if (backupFiles.length > 0) {
        console.log('最近的备份文件:');
        backupFiles.slice(-3).forEach(file => {
            console.log(`  ${file}`);
        });
    }
    
    // 8. 建议解决方案
    console.log('\n8️⃣ 问题诊断和建议');
    console.log('=' .repeat(50));
    
    if (chromeCount > atlasCount) {
        console.log('🔍 发现问题：Chrome 书签数量多于 Atlas');
        console.log('可能原因：');
        console.log('1. Atlas 浏览器正在运行，覆盖了同步的书签');
        console.log('2. Atlas 使用了不同的书签文件');
        console.log('3. 同步后 Atlas 需要重启才能看到新书签');
    } else if (chromeCount === atlasCount) {
        console.log('✅ 书签数量一致，可能已经同步成功');
        console.log('建议：重启 Atlas 浏览器查看书签');
    }
    
    console.log('\n💡 解决建议：');
    console.log('1. 完全关闭 ChatGPT Atlas 浏览器');
    console.log('2. 重新执行同步操作');
    console.log('3. 重新启动 Atlas 浏览器');
    console.log('4. 检查书签是否出现');
}

diagnoseSyncIssue().catch(console.error);