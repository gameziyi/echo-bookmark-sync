// Chrome扩展后台脚本 - 实时书签同步

class BookmarkSyncExtension {
  constructor() {
    this.syncEndpoint = 'http://localhost:3001'; // 同步工具API端点
    this.isEnabled = true;
    this.lastSyncTime = 0;
    
    this.init();
  }

  init() {
    // 监听书签变化事件
    chrome.bookmarks.onCreated.addListener((id, bookmark) => {
      this.handleBookmarkChange('created', bookmark);
    });

    chrome.bookmarks.onRemoved.addListener((id, removeInfo) => {
      this.handleBookmarkChange('removed', { id, ...removeInfo });
    });

    chrome.bookmarks.onChanged.addListener((id, changeInfo) => {
      this.handleBookmarkChange('changed', { id, ...changeInfo });
    });

    chrome.bookmarks.onMoved.addListener((id, moveInfo) => {
      this.handleBookmarkChange('moved', { id, ...moveInfo });
    });

    // 监听来自popup的消息
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // 保持消息通道开放
    });

    console.log('📚 书签同步扩展已启动');
  }

  async handleBookmarkChange(action, data) {
    if (!this.isEnabled) return;

    console.log(`📝 书签${action}:`, data);

    try {
      // 获取完整的书签树
      const bookmarkTree = await chrome.bookmarks.getTree();
      
      // 发送到同步工具
      await this.sendToSyncTool({
        action: 'bookmark_changed',
        changeType: action,
        data: data,
        fullTree: bookmarkTree,
        timestamp: Date.now()
      });

      // 更新最后同步时间
      this.lastSyncTime = Date.now();
      
      // 通知popup更新状态
      this.notifyPopup('sync_completed', {
        action,
        timestamp: this.lastSyncTime
      });

    } catch (error) {
      console.error('❌ 同步失败:', error);
      this.notifyPopup('sync_error', { error: error.message });
    }
  }

  async sendToSyncTool(payload) {
    try {
      const response = await fetch(`${this.syncEndpoint}/api/chrome-sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ 同步成功:', result);
      return result;

    } catch (error) {
      // 如果同步工具未运行，静默失败
      if (error.message.includes('Failed to fetch')) {
        console.log('⚠️ 同步工具未运行，跳过实时同步');
        return null;
      }
      throw error;
    }
  }

  async handleMessage(request, sender, sendResponse) {
    switch (request.action) {
      case 'get_status':
        sendResponse({
          enabled: this.isEnabled,
          lastSync: this.lastSyncTime,
          bookmarkCount: await this.getBookmarkCount()
        });
        break;

      case 'toggle_sync':
        this.isEnabled = !this.isEnabled;
        await chrome.storage.local.set({ syncEnabled: this.isEnabled });
        sendResponse({ enabled: this.isEnabled });
        break;

      case 'manual_sync':
        try {
          const bookmarkTree = await chrome.bookmarks.getTree();
          await this.sendToSyncTool({
            action: 'manual_sync',
            fullTree: bookmarkTree,
            timestamp: Date.now()
          });
          this.lastSyncTime = Date.now();
          sendResponse({ success: true, timestamp: this.lastSyncTime });
        } catch (error) {
          sendResponse({ success: false, error: error.message });
        }
        break;

      case 'get_bookmarks':
        try {
          const bookmarkTree = await chrome.bookmarks.getTree();
          sendResponse({ bookmarks: bookmarkTree });
        } catch (error) {
          sendResponse({ error: error.message });
        }
        break;
    }
  }

  async getBookmarkCount() {
    try {
      const bookmarkTree = await chrome.bookmarks.getTree();
      return this.countBookmarks(bookmarkTree[0]);
    } catch (error) {
      return 0;
    }
  }

  countBookmarks(node) {
    let count = 0;
    if (node.url) {
      count = 1;
    }
    if (node.children) {
      for (const child of node.children) {
        count += this.countBookmarks(child);
      }
    }
    return count;
  }

  notifyPopup(type, data) {
    // 尝试发送消息给popup（如果打开的话）
    chrome.runtime.sendMessage({
      type,
      data,
      timestamp: Date.now()
    }).catch(() => {
      // popup未打开，忽略错误
    });
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.local.get(['syncEnabled']);
      this.isEnabled = result.syncEnabled !== false; // 默认启用
    } catch (error) {
      console.error('加载设置失败:', error);
    }
  }
}

// 启动扩展
const bookmarkSync = new BookmarkSyncExtension();

// 加载保存的设置
bookmarkSync.loadSettings();