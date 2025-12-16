const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs-extra');
const chokidar = require('chokidar');
const BookmarkManager = require('./bookmark-manager');

class BookmarkSyncApp {
  constructor() {
    this.mainWindow = null;
    this.bookmarkManager = new BookmarkManager();
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
          ignoreInitial: true
        });

        watcher.on('change', async () => {
          try {
            // 读取变更后的书签以获取最新内容
            const updatedBookmarks = await this.bookmarkManager.readBookmarks(filePath);
            const result = await this.bookmarkManager.syncBookmarks(config);
            
            this.mainWindow.webContents.send('sync-update', {
              type: 'success',
              message: '书签已同步',
              timestamp: new Date().toISOString(),
              result,
              triggerBrowser: browser,
              triggerPath: filePath
            });
          } catch (error) {
            this.mainWindow.webContents.send('sync-update', {
              type: 'error',
              message: error.message,
              timestamp: new Date().toISOString(),
              triggerBrowser: browser
            });
          }
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