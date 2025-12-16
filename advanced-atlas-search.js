const fs = require('fs-extra');
const path = require('path');
const os = require('os');

async function advancedAtlasSearch() {
    console.log('🔍 高级 ChatGPT Atlas 搜索...\n');
    
    const homeDir = os.homedir();
    
    // 1. 搜索所有 JSON 文件中包含书签结构的
    console.log('1️⃣ 搜索所有可能的书签 JSON 文件...');
    console.log('=' .repeat(50));
    
    const foundBookmarkFiles = [];
    
    // 搜索 ChatGPT 相关目录
    const chatgptDirs = [
        '/Users/Winnie.C/Library/Application Support/ChatGPT',
        '/Users/Winnie.C/Library/Application Support/OpenAI',
        '/Users/Winnie.C/Library/Application Support/com.openai.atlas',
        '/Users/Winnie.C/Library/Application Support/com.openai.chat'
    ];
    
    async function searchForBookmarkFiles(dirPath, depth = 0) {
        if (depth > 4) return; // 限制搜索深度
        
        try {
            const items = await fs.readdir(dirPath);
            
            for (const item of items) {
                const itemPath = path.join(dirPath, item);
                
                try {
                    const stat = await fs.stat(itemPath);
                    
                    if (stat.isFile() && item.endsWith('.json')) {
                        // 检查 JSON 文件内容
                        try {
                            const content = await fs.readFile(itemPath, 'utf8');
                            const data = JSON.parse(content);
                            
                            // 检查是否包含书签相关结构
                            if (data.roots || data.bookmarks || data.favorites || 
                                (Array.isArray(data) && data.some(item => item.url))) {
                                
                                foundBookmarkFiles.push({
                                    path: itemPath,
                                    size: stat.size,
                                    modified: stat.mtime,
                                    structure: Object.keys(data).join(', ')
                                });
                                
                                console.log(`✅ 找到可能的书签文件: ${itemPath}`);
                                console.log(`   结构: ${Object.keys(data).join(', ')}`);
                            }
                        } catch (e) {
                            // 不是有效的 JSON 或不包含书签结构
                        }
                    } else if (stat.isDirectory() && !item.startsWith('.')) {
                        await searchForBookmarkFiles(itemPath, depth + 1);
                    }
                } catch (e) {
                    // 忽略无法访问的文件
                }
            }
        } catch (e) {
            // 忽略无法读取的目录
        }
    }
    
    for (const dir of chatgptDirs) {
        if (await fs.pathExists(dir)) {
            console.log(`🔍 搜索目录: ${dir}`);
            await searchForBookmarkFiles(dir);
        }
    }
    
    // 2. 搜索最近修改的 JSON 文件
    console.log('\n2️⃣ 搜索最近修改的 JSON 文件...');
    console.log('=' .repeat(50));
    
    const recentJsonFiles = [];
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    async function findRecentJsonFiles(dirPath) {
        try {
            const items = await fs.readdir(dirPath);
            
            for (const item of items) {
                const itemPath = path.join(dirPath, item);
                
                try {
                    const stat = await fs.stat(itemPath);
                    
                    if (stat.isFile() && item.endsWith('.json') && stat.mtime > oneDayAgo) {
                        recentJsonFiles.push({
                            path: itemPath,
                            modified: stat.mtime,
                            size: stat.size
                        });
                    }
                } catch (e) {
                    // 忽略
                }
            }
        } catch (e) {
            // 忽略
        }
    }
    
    // 搜索用户目录下的最近 JSON 文件
    const searchDirs = [
        path.join(homeDir, 'Library/Application Support'),
        path.join(homeDir, 'Library/Preferences'),
        path.join(homeDir, 'Library/Caches'),
        path.join(homeDir, 'Documents'),
        path.join(homeDir, 'Downloads')
    ];
    
    for (const dir of searchDirs) {
        if (await fs.pathExists(dir)) {
            await findRecentJsonFiles(dir);
        }
    }
    
    recentJsonFiles.sort((a, b) => b.modified - a.modified);
    
    if (recentJsonFiles.length > 0) {
        console.log('最近修改的 JSON 文件 (可能包含书签):');
        recentJsonFiles.slice(0, 10).forEach((file, index) => {
            console.log(`${index + 1}. ${file.path}`);
            console.log(`   修改时间: ${file.modified.toLocaleString()}`);
        });
    }
    
    // 3. 检查 ChatGPT Atlas 应用包
    console.log('\n3️⃣ 检查 ChatGPT Atlas 应用包...');
    console.log('=' .repeat(50));
    
    const appPaths = [
        '/Applications/ChatGPT Atlas.app',
        '/Applications/ChatGPT.app',
        path.join(homeDir, 'Applications/ChatGPT Atlas.app'),
        path.join(homeDir, 'Applications/ChatGPT.app')
    ];
    
    for (const appPath of appPaths) {
        if (await fs.pathExists(appPath)) {
            console.log(`✅ 找到应用: ${appPath}`);
            
            // 检查应用包内的资源
            const resourcesPath = path.join(appPath, 'Contents/Resources');
            if (await fs.pathExists(resourcesPath)) {
                console.log(`   资源目录: ${resourcesPath}`);
            }
        }
    }
    
    // 4. 生成测试建议
    console.log('\n4️⃣ 测试建议');
    console.log('=' .repeat(50));
    
    console.log('📝 创建测试书签的步骤:');
    console.log('1. 打开 ChatGPT Atlas 应用');
    console.log('2. 添加一个测试书签 (例如: https://test.com)');
    console.log('3. 关闭应用');
    console.log('4. 重新运行这个搜索工具');
    console.log('5. 查看是否有新的 JSON 文件被创建或修改');
    
    console.log('\n🔧 手动查找方法:');
    console.log('1. 在 Spotlight 中搜索 "ChatGPT Atlas"');
    console.log('2. 右键点击应用 -> 显示包内容');
    console.log('3. 查看 Contents/Resources 或 Contents/MacOS 目录');
    console.log('4. 或者在应用的偏好设置中查找数据存储位置');
    
    // 5. 显示总结
    console.log('\n📊 搜索总结');
    console.log('=' .repeat(50));
    
    if (foundBookmarkFiles.length > 0) {
        console.log(`✅ 找到 ${foundBookmarkFiles.length} 个可能的书签文件`);
        console.log('建议按修改时间从新到旧依次尝试这些文件');
    } else {
        console.log('❌ 未找到明确的书签文件');
        console.log('💡 ChatGPT Atlas 可能:');
        console.log('   - 使用不同的存储格式');
        console.log('   - 还没有创建书签文件');
        console.log('   - 将书签存储在云端');
        console.log('   - 使用加密或二进制格式');
    }
    
    return { foundBookmarkFiles, recentJsonFiles };
}

advancedAtlasSearch().catch(console.error);