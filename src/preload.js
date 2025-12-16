const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 获取浏览器路径
  getBrowserPaths: () => ipcRenderer.invoke('get-browser-paths'),
  
  // 同步控制
  startSync: (config) => ipcRenderer.invoke('start-sync', config),
  stopSync: () => ipcRenderer.invoke('stop-sync'),
  manualSync: (config) => ipcRenderer.invoke('manual-sync', config),
  
  // 文件选择
  selectPath: () => ipcRenderer.invoke('select-path'),
  
  // 获取 Atlas 路径建议
  getAtlasSuggestions: () => ipcRenderer.invoke('get-atlas-suggestions'),
  
  // 分析书签状态
  analyzeBookmarks: (config) => ipcRenderer.invoke('analyze-bookmarks', config),
  
  // Atlas重启助手
  restartAtlas: () => ipcRenderer.invoke('restart-atlas'),
  checkAtlasStatus: () => ipcRenderer.invoke('check-atlas-status'),
  
  // 监听同步更新
  onSyncUpdate: (callback) => {
    ipcRenderer.on('sync-update', (event, data) => callback(data));
  },
  
  // 移除监听器
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});