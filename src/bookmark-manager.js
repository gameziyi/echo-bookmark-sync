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

  // 智能合并书签 - 支持删除同步和时间戳优先
  async mergeBookmarks(source, target, sourceModTime, targetModTime) {
    const merged = { ...target };
    
    // 确定哪个文件更新（用于冲突解决）
    const sourceIsNewer = sourceModTime > targetModTime;
    
    if (source.roots && target.roots) {
      // 合并书签栏
      if (source.roots.bookmark_bar && target.roots.bookmark_bar) {
        const mergeResult = this.intelligentMergeNodes(
          source.roots.bookmark_bar.children || [],
          target.roots.bookmark_bar.children || [],
          sourceIsNewer,
          'bookmark_bar'
        );
        merged.roots.bookmark_bar.children = mergeResult.nodes;
      }
      
      // 合并其他书签
      if (source.roots.other && target.roots.other) {
        const mergeResult = this.intelligentMergeNodes(
          source.roots.other.children || [],
          target.roots.other.children || [],
          sourceIsNewer,
          'other'
        );
        merged.roots.other.children = mergeResult.nodes;
      }
    }

    return merged;
  }

  // 智能合并书签节点 - 处理新增、删除、冲突
  intelligentMergeNodes(sourceNodes, targetNodes, sourceIsNewer, location) {
    const result = {
      nodes: [],
      operations: {
        added: [],
        removed: [],
        conflicts: []
      }
    };

    // 创建URL到书签的映射
    const sourceMap = new Map();
    const targetMap = new Map();
    
    // 处理源节点
    sourceNodes.forEach(node => {
      if (node.url) {
        sourceMap.set(node.url, node);
      } else if (node.children) {
        // 文件夹按名称映射
        sourceMap.set(`folder:${node.name}`, node);
      }
    });
    
    // 处理目标节点
    targetNodes.forEach(node => {
      if (node.url) {
        targetMap.set(node.url, node);
      } else if (node.children) {
        targetMap.set(`folder:${node.name}`, node);
      }
    });

    // 合并逻辑
    const allKeys = new Set([...sourceMap.keys(), ...targetMap.keys()]);
    
    for (const key of allKeys) {
      const sourceNode = sourceMap.get(key);
      const targetNode = targetMap.get(key);
      
      if (sourceNode && targetNode) {
        // 两边都存在
        if (key.startsWith('folder:')) {
          // 文件夹递归合并
          const folderResult = this.intelligentMergeNodes(
            sourceNode.children || [],
            targetNode.children || [],
            sourceIsNewer,
            `${location}/${sourceNode.name}`
          );
          
          result.nodes.push({
            ...targetNode,
            children: folderResult.nodes
          });
          
          // 合并操作记录
          result.operations.added.push(...folderResult.operations.added);
          result.operations.removed.push(...folderResult.operations.removed);
          result.operations.conflicts.push(...folderResult.operations.conflicts);
        } else {
          // 书签存在于两边，检查是否有冲突
          if (this.bookmarksEqual(sourceNode, targetNode)) {
            result.nodes.push(targetNode);
          } else {
            // 有冲突，基于时间戳决定
            const chosenNode = sourceIsNewer ? sourceNode : targetNode;
            result.nodes.push(chosenNode);
            
            result.operations.conflicts.push({
              type: 'modified',
              location,
              chosen: sourceIsNewer ? 'source' : 'target',
              bookmark: chosenNode
            });
          }
        }
      } else if (sourceNode && !targetNode) {
        // 只在源中存在
        if (sourceIsNewer) {
          // 源更新，这是新增的书签
          result.nodes.push(sourceNode);
          result.operations.added.push({
            type: 'added',
            location,
            bookmark: sourceNode
          });
        } else {
          // 目标更新，这个书签被删除了，不添加到结果中
          result.operations.removed.push({
            type: 'removed',
            location,
            bookmark: sourceNode,
            reason: 'deleted_in_target'
          });
        }
      } else if (!sourceNode && targetNode) {
        // 只在目标中存在
        if (!sourceIsNewer) {
          // 目标更新，这是新增的书签
          result.nodes.push(targetNode);
          result.operations.added.push({
            type: 'added',
            location,
            bookmark: targetNode
          });
        } else {
          // 源更新，这个书签被删除了，不添加到结果中
          result.operations.removed.push({
            type: 'removed',
            location,
            bookmark: targetNode,
            reason: 'deleted_in_source'
          });
        }
      }
    }

    return result;
  }

  // 检查两个书签是否相等
  bookmarksEqual(bookmark1, bookmark2) {
    if (bookmark1.url !== bookmark2.url) return false;
    if (bookmark1.name !== bookmark2.name) return false;
    if (bookmark1.date_added !== bookmark2.date_added) return false;
    return true;
  }

  // 分析书签统计信息
  analyzeBookmarks(bookmarks) {
    const stats = {
      totalBookmarks: 0,
      totalFolders: 0,
      bookmarkBarItems: 0,
      otherBookmarksItems: 0,
      urls: [],
      folders: []
    };

    const analyzeNode = (node, path = '') => {
      if (node.type === 'url') {
        stats.totalBookmarks++;
        stats.urls.push({
          name: node.name,
          url: node.url,
          path: path
        });
      } else if (node.type === 'folder') {
        stats.totalFolders++;
        stats.folders.push({
          name: node.name,
          path: path,
          childCount: node.children ? node.children.length : 0
        });
        
        if (node.children) {
          node.children.forEach(child => {
            analyzeNode(child, path ? `${path}/${node.name}` : node.name);
          });
        }
      }
    };

    if (bookmarks.roots.bookmark_bar && bookmarks.roots.bookmark_bar.children) {
      bookmarks.roots.bookmark_bar.children.forEach(child => {
        analyzeNode(child, '书签栏');
        stats.bookmarkBarItems++;
      });
    }

    if (bookmarks.roots.other && bookmarks.roots.other.children) {
      bookmarks.roots.other.children.forEach(child => {
        analyzeNode(child, '其他书签');
        stats.otherBookmarksItems++;
      });
    }

    return stats;
  }

  // 比较两个书签集合的差异
  compareBookmarks(chromeBookmarks, atlasBookmarks) {
    const chromeStats = this.analyzeBookmarks(chromeBookmarks);
    const atlasStats = this.analyzeBookmarks(atlasBookmarks);
    
    const chromeUrls = new Set(chromeStats.urls.map(b => b.url));
    const atlasUrls = new Set(atlasStats.urls.map(b => b.url));
    
    const onlyInChrome = chromeStats.urls.filter(b => !atlasUrls.has(b.url));
    const onlyInAtlas = atlasStats.urls.filter(b => !chromeUrls.has(b.url));
    const common = chromeStats.urls.filter(b => atlasUrls.has(b.url));
    
    return {
      chromeStats,
      atlasStats,
      differences: {
        onlyInChrome,
        onlyInAtlas,
        common,
        needsSync: onlyInChrome.length > 0 || onlyInAtlas.length > 0
      }
    };
  }

  // 检测最新添加的书签
  detectLatestBookmarks(bookmarks, count = 5) {
    const allBookmarks = [];
    
    const extractBookmarks = (node) => {
      if (node.type === 'url') {
        allBookmarks.push({
          name: node.name,
          url: node.url,
          dateAdded: parseInt(node.date_added) || 0
        });
      } else if (node.children) {
        node.children.forEach(extractBookmarks);
      }
    };

    if (bookmarks.roots.bookmark_bar && bookmarks.roots.bookmark_bar.children) {
      bookmarks.roots.bookmark_bar.children.forEach(extractBookmarks);
    }
    if (bookmarks.roots.other && bookmarks.roots.other.children) {
      bookmarks.roots.other.children.forEach(extractBookmarks);
    }

    // 按添加时间排序，返回最新的几个
    return allBookmarks
      .sort((a, b) => b.dateAdded - a.dateAdded)
      .slice(0, count);
  }

  // 获取文件修改时间
  async getFileModTime(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return stats.mtime.getTime();
    } catch (error) {
      return 0;
    }
  }

  // 同步书签 - 支持删除同步和时间戳优先
  async syncBookmarks(config) {
    const { chromePath, atlasPath, syncDirection = 'bidirectional' } = config;
    
    if (!chromePath || !atlasPath) {
      throw new Error('请指定 Chrome 和 Atlas 的书签文件路径');
    }

    const chromeBookmarks = await this.readBookmarks(chromePath);
    const atlasBookmarks = await this.readBookmarks(atlasPath);

    // 获取文件修改时间
    const chromeModTime = await this.getFileModTime(chromePath);
    const atlasModTime = await this.getFileModTime(atlasPath);

    // 分析同步前的差异
    const comparison = this.compareBookmarks(chromeBookmarks, atlasBookmarks);

    // 检测最新书签
    const chromeLatest = this.detectLatestBookmarks(chromeBookmarks, 3);
    const atlasLatest = this.detectLatestBookmarks(atlasBookmarks, 3);

    let result = {
      chromeUpdated: false,
      atlasUpdated: false,
      conflicts: [],
      beforeSync: comparison,
      latestBookmarks: {
        chrome: chromeLatest,
        atlas: atlasLatest
      },
      syncedItems: {
        addedToChrome: [],
        addedToAtlas: [],
        removedFromChrome: [],
        removedFromAtlas: [],
        totalSynced: 0
      },
      fileModTimes: {
        chrome: chromeModTime,
        atlas: atlasModTime,
        chromeIsNewer: chromeModTime > atlasModTime
      }
    };

    switch (syncDirection) {
      case 'chrome-to-atlas':
        await this.writeBookmarks(atlasPath, chromeBookmarks);
        result.atlasUpdated = true;
        result.syncedItems.addedToAtlas = comparison.differences.onlyInChrome;
        result.syncedItems.totalSynced = comparison.differences.onlyInChrome.length;
        break;
        
      case 'atlas-to-chrome':
        await this.writeBookmarks(chromePath, atlasBookmarks);
        result.chromeUpdated = true;
        result.syncedItems.addedToChrome = comparison.differences.onlyInAtlas;
        result.syncedItems.totalSynced = comparison.differences.onlyInAtlas.length;
        break;
        
      case 'bidirectional':
      default:
        // 智能双向同步，支持删除和时间戳优先
        const mergedBookmarks = await this.mergeBookmarks(
          chromeBookmarks, 
          atlasBookmarks, 
          chromeModTime, 
          atlasModTime
        );
        
        // 分析实际的变更操作
        const chromeComparison = this.compareBookmarks(chromeBookmarks, mergedBookmarks);
        const atlasComparison = this.compareBookmarks(atlasBookmarks, mergedBookmarks);
        
        const needsChromeUpdate = chromeComparison.differences.needsSync;
        const needsAtlasUpdate = atlasComparison.differences.needsSync;
        
        if (needsChromeUpdate) {
          await this.writeBookmarks(chromePath, mergedBookmarks);
          result.chromeUpdated = true;
          result.syncedItems.addedToChrome = chromeComparison.differences.onlyInAtlas;
          result.syncedItems.removedFromChrome = chromeComparison.differences.onlyInChrome;
        }
        
        if (needsAtlasUpdate) {
          await this.writeBookmarks(atlasPath, mergedBookmarks);
          result.atlasUpdated = true;
          result.syncedItems.addedToAtlas = atlasComparison.differences.onlyInAtlas;
          result.syncedItems.removedFromAtlas = atlasComparison.differences.onlyInChrome;
        }
        
        // 计算总的同步操作数
        result.syncedItems.totalSynced = 
          result.syncedItems.addedToChrome.length + 
          result.syncedItems.addedToAtlas.length +
          result.syncedItems.removedFromChrome.length +
          result.syncedItems.removedFromAtlas.length;
        
        break;
    }

    return result;
  }
}

module.exports = BookmarkManager;