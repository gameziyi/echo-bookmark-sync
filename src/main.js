const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs-extra');
const chokidar = require('chokidar');
const BookmarkManager = require('./bookmark-manager');
const AtlasRestartHelper = require('../atlas-restart-helper');

class BookmarkSyncApp {
  constructor() {
    this.mainWindow = null;
    this.bookmarkManager = new BookmarkManager();
    this.atlasRestartHelper = new AtlasRestartHelper();
    this.watchers = [];
  }

  createWindow() {
    this.mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      },
      icon: path.join(__dirname, '../assets/icon.png'),
      titleBarStyle: 'default'
    });

    this.mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));

    if (process.argv.includes('--dev')) {
      this.mainWindow.webContents.openDevTools();
    }
  }

  setupIPC() {
    // 获取浏览器路径
    ipcMain.handle('get-browser-paths', async () => {
      return await this.bookmarkManager.detectBrowserPaths();
    });

    // 开始同步
    ipcMain.handle('start-sync', async (event, config) => {
      try {
        await this.startWatching(config);
        return { success: true, message: '同步已启动' };
      } catch (error) {
        return { success: false, message: error.message };
      }
    });

    // 停止同步
    ipcMain.handle('stop-sync', async () => {
      this.stopWatching();
      return { success: true, message: '同步已停止' };
    });

    // 手动同步
    ipcMain.handle('manual-sync', async (event, config) => {
      try {
        const result = await this.bookmarkManager.syncBookmarks(config);
        return { success: true, result };
      } catch (error) {
        return { success: false, message: error.message };
      }
    });

    // 选择自定义路径
    ipcMain.handle('select-path', async () => {
      const result = await dialog.showOpenDialog(this.mainWindow, {
        properties: ['openFile'],
        filters: [
          { name: 'Bookmark Files', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });
      return result.filePaths[0] || null;
    });

    // 获取 Atlas 路径建议
    ipcMain.handle('get-atlas-suggestions', async () => {
      return this.bookmarkManager.getAtlasPathSuggestions();
    });

    // 分析书签状态
    ipcMain.handle('analyze-bookmarks', async (event, config) => {
      try {
        const chromeBookmarks = await this.bookmarkManager.readBookmarks(config.chromePath);
        const atlasBookmarks = await this.bookmarkManager.readBookmarks(config.atlasPath);
        const comparison = this.bookmarkManager.compareBookmarks(chromeBookmarks, atlasBookmarks);
        
        return { success: true, data: comparison };
      } catch (error) {
        return { success: false, message: error.message };
      }
    });

    // Atlas重启助手
    ipcMain.handle('restart-atlas', async () => {
      try {
        console.log('🔄 收到Atlas重启请求');
        const result = await this.atlasRestartHelper.restartAtlas();
        console.log('🔄 Atlas重启结果:', result);
        return result;
      } catch (error) {
        console.error('❌ Atlas重启失败:', error.message);
        return { success: false, message: error.message };
      }
    });

    // 检查Atlas运行状态
    ipcMain.handle('check-atlas-status', async () => {
      try {
        const isRunning = await this.atlasRestartHelper.isAtlasRunning();
        return { success: true, isRunning };
      } catch (error) {
        return { success: false, message: error.message };
      }
    });
  }

  async startWatching(config) {
    this.stopWatching();

    const pathsToWatch = [
      { path: config.chromePath, browser: 'Chrome' },
      { path: config.atlasPath, browser: 'Atlas' }
    ].filter(item => item.path);
    
    for (const { path: filePath, browser } of pathsToWatch) {
      if (await fs.pathExists(filePath)) {
        const watcher = chokidar.watch(filePath, {
          persistent: true,
          ignoreInitial: true,
          usePolling: true,  // 使用轮询模式，更可靠
          interval: 2000,    // 每2秒检查一次
          binaryInterval: 2000
        });

        watcher.on('change', async () => {
          console.log(`📁 检测到 ${browser} 文件变化: ${filePath}`);
          
          try {
            // 等待一下确保文件写入完成
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // 读取变更后的书签以获取最新内容
            const updatedBookmarks = await this.bookmarkManager.readBookmarks(filePath);
            console.log(`📊 ${browser} 书签数量: ${this.bookmarkManager.analyzeBookmarks(updatedBookmarks).totalBookmarks}`);
            
            const result = await this.bookmarkManager.syncBookmarks(config);
            console.log(`🔄 同步结果: Chrome更新=${result.chromeUpdated}, Atlas更新=${result.atlasUpdated}, 总数=${result.syncedItems.totalSynced}`);
            
            this.mainWindow.webContents.send('sync-update', {
              type: 'success',
              message: '书签已同步',
              timestamp: new Date().toISOString(),
              result,
              triggerBrowser: browser,
              triggerPath: filePath
            });
          } catch (error) {
            console.error(`❌ ${browser} 同步失败:`, error.message);
            this.mainWindow.webContents.send('sync-update', {
              type: 'error',
              message: error.message,
              timestamp: new Date().toISOString(),
              triggerBrowser: browser
            });
          }
        });

        watcher.on('error', (error) => {
          console.error(`❌ ${browser} 文件监控错误:`, error.message);
        });

        watcher.on('ready', () => {
          console.log(`✅ ${browser} 文件监控已启动: ${filePath}`);
        });

        this.watchers.push(watcher);
      }
    }
  }

  stopWatching() {
    this.watchers.forEach(watcher => watcher.close());
    this.watchers = [];
  }

  init() {
    app.whenReady().then(() => {
      this.createWindow();
      this.setupIPC();

      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          this.createWindow();
        }
      });
    });

    app.on('window-all-closed', () => {
      this.stopWatching();
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('before-quit', () => {
      this.stopWatching();
    });
  }
}

const bookmarkApp = new BookmarkSyncApp();
bookmarkApp.init();