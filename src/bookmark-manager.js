const fs = require('fs-extra');
const path = require('path');
const os = require('os');

class BookmarkManager {
  constructor() {
    this.platform = os.platform();
  }

  // 检测浏览器安装路径
  async detectBrowserPaths() {
    const paths = {
      chrome: null,
      atlas: null
    };

    try {
      // Chrome 书签路径
      const chromeBookmarkPath = this.getChromeBookmarkPath();
      if (await fs.pathExists(chromeBookmarkPath)) {
        paths.chrome = chromeBookmarkPath;
      }

      // ChatGPT Atlas 书签路径 (需要用户手动指定)
      // Atlas 可能使用不同的存储方式，这里提供一个通用的检测逻辑
      const atlasPath = await this.detectAtlasPath();
      if (atlasPath) {
        paths.atlas = atlasPath;
      }

    } catch (error) {
      console.error('检测浏览器路径时出错:', error);
    }

    return paths;
  }

  // 获取 Chrome 书签文件路径
  getChromeBookmarkPath() {
    const homeDir = os.homedir();
    
    switch (this.platform) {
      case 'darwin': // macOS
        return path.join(homeDir, 'Library/Application Support/Google/Chrome/Default/Bookmarks');
      case 'win32': // Windows
        return path.join(homeDir, 'AppData/Local/Google/Chrome/User Data/Default/Bookmarks');
      case 'linux':
        return path.join(homeDir, '.config/google-chrome/Default/Bookmarks');
      default:
        throw new Error('不支持的操作系统');
    }
  }

  // 检测 ChatGPT Atlas 路径
  async detectAtlasPath() {
    const homeDir = os.homedir();
    const possiblePaths = [];

    switch (this.platform) {
      case 'darwin':
        // 首先检查实际发现的 Atlas 路径模式
        const atlasBasePath = path.join(homeDir, 'Library/Application Support/com.openai.atlas/browser-data/host');
        
        try {
          if (await fs.pathExists(atlasBasePath)) {
            const userDirs = await fs.readdir(atlasBasePath);
            for (const userDir of userDirs) {
              if (userDir.startsWith('user-')) {
                const bookmarksPath = path.join(atlasBasePath, userDir, 'Bookmarks');
                if (await fs.pathExists(bookmarksPath)) {
                  possiblePaths.push(bookmarksPath);
                }
              }
            }
          }
        } catch (e) {
          // 忽略错误，继续检查其他路径
        }

        // 添加其他可能的路径
        possiblePaths.push(
          // 常见的 Atlas 路径
          path.join(homeDir, 'Library/Application Support/ChatGPT Atlas/bookmarks.json'),
          path.join(homeDir, 'Library/Application Support/OpenAI/ChatGPT Atlas/bookmarks.json'),
          path.join(homeDir, 'Library/Application Support/ChatGPT Atlas/Default/Bookmarks'),
          path.join(homeDir, 'Library/Application Support/ChatGPT Atlas/User Data/Default/Bookmarks'),
          // 可能的其他位置
          path.join(homeDir, 'Library/Preferences/ChatGPT Atlas/bookmarks.json'),
          path.join(homeDir, 'Library/Caches/ChatGPT Atlas/bookmarks.json'),
          // Electron 应用常见路径
          path.join(homeDir, 'Library/Application Support/chatgpt-atlas/bookmarks.json'),
          path.join(homeDir, 'Library/Application Support/com.openai.atlas/bookmarks.json')
        );
        break;
        
      case 'win32':
        // Windows 路径检测逻辑
        const winAtlasBasePath = path.join(homeDir, 'AppData/Local/com.openai.atlas/browser-data/host');
        
        try {
          if (await fs.pathExists(winAtlasBasePath)) {
            const userDirs = await fs.readdir(winAtlasBasePath);
            for (const userDir of userDirs) {
              if (userDir.startsWith('user-')) {
                const bookmarksPath = path.join(winAtlasBasePath, userDir, 'Bookmarks');
                if (await fs.pathExists(bookmarksPath)) {
                  possiblePaths.push(bookmarksPath);
                }
              }
            }
          }
        } catch (e) {
          // 忽略错误
        }

        possiblePaths.push(
          // Windows 常见路径
          path.join(homeDir, 'AppData/Local/ChatGPT Atlas/bookmarks.json'),
          path.join(homeDir, 'AppData/Roaming/ChatGPT Atlas/bookmarks.json'),
          path.join(homeDir, 'AppData/Local/ChatGPT Atlas/User Data/Default/Bookmarks'),
          path.join(homeDir, 'AppData/Local/Programs/ChatGPT Atlas/bookmarks.json'),
          // 可能的其他位置
          path.join(homeDir, 'AppData/Local/chatgpt-atlas/bookmarks.json'),
          path.join(homeDir, 'AppData/Roaming/com.openai.atlas/bookmarks.json')
        );
        break;
    }

    // 检查所有可能的路径
    for (const filePath of possiblePaths) {
      if (await fs.pathExists(filePath)) {
        // 验证文件是否是有效的书签文件
        try {
          const content = await fs.readFile(filePath, 'utf8');
          const data = JSON.parse(content);
          if (data.roots && (data.roots.bookmark_bar || data.roots.other)) {
            return filePath;
          }
        } catch (e) {
          // 不是有效的书签文件，继续检查下一个
        }
      }
    }

    return null;
  }

  // 获取 Atlas 可能路径的建议
  getAtlasPathSuggestions() {
    const homeDir = os.homedir();
    const suggestions = [];

    switch (this.platform) {
      case 'darwin':
        suggestions.push(
          '~/Library/Application Support/ChatGPT Atlas/',
          '~/Library/Application Support/OpenAI/',
          '~/Library/Preferences/ChatGPT Atlas/',
          '~/Library/Caches/ChatGPT Atlas/'
        );
        break;
      case 'win32':
        suggestions.push(
          '%USERPROFILE%/AppData/Local/ChatGPT Atlas/',
          '%USERPROFILE%/AppData/Roaming/ChatGPT Atlas/',
          '%USERPROFILE%/AppData/Local/Programs/ChatGPT Atlas/'
        );
        break;
    }

    return suggestions;
  }

  // 读取书签文件
  async readBookmarks(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`读取书签文件失败: ${error.message}`);
    }
  }

  // 写入书签文件
  async writeBookmarks(filePath, bookmarks) {
    try {
      // 创建备份
      const backupPath = `${filePath}.backup.${Date.now()}`;
      if (await fs.pathExists(filePath)) {
        await fs.copy(filePath, backupPath);
      }

      await fs.writeFile(filePath, JSON.stringify(bookmarks, null, 2), 'utf8');
      return true;
    } catch (error) {
      throw new Error(`写入书签文件失败: ${error.message}`);
    }
  }

  // 合并书签
  mergeBookmarks(source, target) {
    // 简化的合并逻辑，基于时间戳
    const merged = { ...target };
    
    if (source.roots && target.roots) {
      // 合并书签栏
      if (source.roots.bookmark_bar && target.roots.bookmark_bar) {
        merged.roots.bookmark_bar.children = this.mergeBookmarkNodes(
          source.roots.bookmark_bar.children || [],
          target.roots.bookmark_bar.children || []
        );
      }
      
      // 合并其他书签
      if (source.roots.other && target.roots.other) {
        merged.roots.other.children = this.mergeBookmarkNodes(
          source.roots.other.children || [],
          target.roots.other.children || []
        );
      }
    }

    return merged;
  }

  // 合并书签节点
  mergeBookmarkNodes(sourceNodes, targetNodes) {
    const merged = [...targetNodes];
    const targetUrls = new Set(targetNodes.filter(n => n.url).map(n => n.url));

    for (const sourceNode of sourceNodes) {
      if (sourceNode.url && !targetUrls.has(sourceNode.url)) {
        // 新书签，直接添加
        merged.push(sourceNode);
      } else if (sourceNode.children) {
        // 文件夹，递归合并
        const targetFolder = merged.find(n => n.name === sourceNode.name && n.children);
        if (targetFolder) {
          targetFolder.children = this.mergeBookmarkNodes(
            sourceNode.children,
            targetFolder.children
          );
        } else {
          merged.push(sourceNode);
        }
      }
    }

    return merged;
  }

  // 同步书签
  async syncBookmarks(config) {
    const { chromePath, atlasPath, syncDirection = 'bidirectional' } = config;
    
    if (!chromePath || !atlasPath) {
      throw new Error('请指定 Chrome 和 Atlas 的书签文件路径');
    }

    const chromeBookmarks = await this.readBookmarks(chromePath);
    const atlasBookmarks = await this.readBookmarks(atlasPath);

    let result = {
      chromeUpdated: false,
      atlasUpdated: false,
      conflicts: []
    };

    switch (syncDirection) {
      case 'chrome-to-atlas':
        await this.writeBookmarks(atlasPath, chromeBookmarks);
        result.atlasUpdated = true;
        break;
        
      case 'atlas-to-chrome':
        await this.writeBookmarks(chromePath, atlasBookmarks);
        result.chromeUpdated = true;
        break;
        
      case 'bidirectional':
      default:
        // 双向同步，合并书签
        const mergedBookmarks = this.mergeBookmarks(chromeBookmarks, atlasBookmarks);
        
        // 检查是否有变化
        const chromeChanged = JSON.stringify(chromeBookmarks) !== JSON.stringify(mergedBookmarks);
        const atlasChanged = JSON.stringify(atlasBookmarks) !== JSON.stringify(mergedBookmarks);
        
        if (chromeChanged) {
          await this.writeBookmarks(chromePath, mergedBookmarks);
          result.chromeUpdated = true;
        }
        
        if (atlasChanged) {
          await this.writeBookmarks(atlasPath, mergedBookmarks);
          result.atlasUpdated = true;
        }
        break;
    }

    return result;
  }
}

module.exports = BookmarkManager;