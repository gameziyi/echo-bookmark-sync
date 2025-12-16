const fs = require('fs-extra');
const path = require('path');
const os = require('os');

async function findAtlasBookmarks() {
    console.log('🔍 正在搜索 ChatGPT Atlas 书签文件...\n');
    
    const homeDir = os.homedir();
    const platform = os.platform();
    
    // 扩展的搜索路径
    const searchPaths = [];
    
    if (platform === 'darwin') {
        // macOS 搜索路径
        searchPaths.push(
            // 应用支持目录
            path.join(homeDir, 'Library/Application Support'),
            // 偏好设置目录
            path.join(homeDir, 'Library/Preferences'),
            // 缓存目录
            path.join(homeDir, 'Library/Caches'),
            // 容器目录
            path.join(homeDir, 'Library/Containers'),
            // 用户应用目录
            path.join(homeDir, 'Applications')
        );
    } else if (platform === 'win32') {
        // Windows 搜索路径
        searchPaths.push(
            path.join(homeDir, 'AppData/Local'),
            path.join(homeDir, 'AppData/Roaming'),
            path.join(homeDir, 'AppData/LocalLow')
        );
    }
    
    const foundFiles = [];
    
    // 搜索函数
    async function searchInDirectory(dirPath, maxDepth = 3, currentDepth = 0) {
        if (currentDepth > maxDepth) return;
        
        try {
            const items = await fs.readdir(dirPath);
            
            for (const item of items) {
                const itemPath = path.join(dirPath, item);
                
                try {
                    const stat = await fs.stat(itemPath);
                    
                    if (stat.isFile()) {
                        // 检查是否是书签相关文件
                        if (item.toLowerCase().includes('bookmark') || 
                            (item.toLowerCase().endsWith('.json') && 
                             (item.toLowerCase().includes('atlas') || 
                              item.toLowerCase().includes('chatgpt')))) {
                            
                            // 验证是否是有效的书签文件
                            try {
                                const content = await fs.readFile(itemPath, 'utf8');
                                const data = JSON.parse(content);
                                
                                if (data.roots && (data.roots.bookmark_bar || data.roots.other)) {
                                    foundFiles.push({
                                        path: itemPath,
                                        size: stat.size,
                                        modified: stat.mtime,
                                        type: 'bookmark'
                                    });
                                }
                            } catch (e) {
                                // 不是有效的书签文件，忽略
                            }
                        }
                    } else if (stat.isDirectory()) {
                        // 检查目录名是否包含相关关键词
                        const dirName = item.toLowerCase();
                        if (dirName.includes('atlas') || 
                            dirName.includes('chatgpt') || 
                            dirName.includes('openai') ||
                            dirName.includes('chat-gpt') ||
                            dirName.includes('gpt')) {
                            
                            console.log(`🔍 搜索目录: ${itemPath}`);
                            await searchInDirectory(itemPath, maxDepth, currentDepth + 1);
                        }
                    }
                } catch (e) {
                    // 忽略无法访问的文件/目录
                }
            }
        } catch (e) {
            // 忽略无法读取的目录
        }
    }
    
    // 在所有搜索路径中查找
    for (const searchPath of searchPaths) {
        console.log(`📂 搜索路径: ${searchPath}`);
        if (await fs.pathExists(searchPath)) {
            await searchInDirectory(searchPath);
        }
    }
    
    // 显示结果
    console.log('\n📋 搜索结果:');
    console.log('=' .repeat(60));
    
    if (foundFiles.length === 0) {
        console.log('❌ 未找到 ChatGPT Atlas 书签文件');
        console.log('\n💡 建议:');
        console.log('1. 确保 ChatGPT Atlas 已安装并运行过');
        console.log('2. 在 Atlas 中添加一个测试书签');
        console.log('3. 检查 Atlas 应用的设置中是否有数据存储位置信息');
        console.log('4. 尝试搜索整个系统中的 "bookmarks.json" 文件');
    } else {
        console.log(`✅ 找到 ${foundFiles.length} 个可能的书签文件:`);
        
        foundFiles.sort((a, b) => b.modified - a.modified); // 按修改时间排序
        
        foundFiles.forEach((file, index) => {
            console.log(`\n${index + 1}. ${file.path}`);
            console.log(`   大小: ${(file.size / 1024).toFixed(2)} KB`);
            console.log(`   修改时间: ${file.modified.toLocaleString()}`);
        });
        
        console.log('\n💡 建议使用最近修改的文件作为 Atlas 书签路径');
    }
    
    // 额外的手动搜索建议
    console.log('\n🔧 手动搜索建议:');
    console.log('=' .repeat(60));
    
    if (platform === 'darwin') {
        console.log('在 Finder 中搜索:');
        console.log('- 按 Cmd+Space 打开 Spotlight');
        console.log('- 搜索 "bookmarks.json ChatGPT"');
        console.log('- 或搜索 "Atlas" 然后查看应用包内容');
    } else if (platform === 'win32') {
        console.log('在 Windows 中搜索:');
        console.log('- 按 Win+S 打开搜索');
        console.log('- 搜索 "bookmarks.json"');
        console.log('- 在文件资源管理器中搜索 "ChatGPT Atlas"');
    }
    
    console.log('\n📱 Atlas 应用内查找:');
    console.log('- 打开 ChatGPT Atlas');
    console.log('- 查看菜单 -> 偏好设置/设置');
    console.log('- 寻找 "数据位置" 或 "用户数据" 选项');
    console.log('- 或查看 "关于" 页面中的应用信息');
    
    return foundFiles;
}

// 运行搜索
findAtlasBookmarks().catch(console.error);