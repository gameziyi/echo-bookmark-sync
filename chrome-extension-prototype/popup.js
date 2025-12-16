// Chrome扩展弹窗脚本

class PopupController {
  constructor() {
    this.statusDot = document.getElementById('statusDot');
    this.statusText = document.getElementById('statusText');
    this.bookmarkCount = document.getElementById('bookmarkCount');
    this.lastSync = document.getElementById('lastSync');
    this.toggleBtn = document.getElementById('toggleBtn');
    this.syncBtn = document.getElementById('syncBtn');
    this.logArea = document.getElementById('logArea');
    
    this.init();
  }

  init() {
    // 绑定事件
    this.toggleBtn.addEventListener('click', () => this.toggleSync());
    this.syncBtn.addEventListener('click', () => this.manualSync());
    
    // 监听后台消息
    chrome.runtime.onMessage.addListener((message) => {
      this.handleBackgroundMessage(message);
    });
    
    // 获取初始状态
    this.updateStatus();
  }

  async updateStatus() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'get_status' });
      
      if (response.enabled) {
        this.statusDot.className = 'status-dot enabled';
        this.statusText.textContent = '实时同步已启用';
        this.toggleBtn.textContent = '禁用';
      } else {
        this.statusDot.className = 'status-dot disabled';
        this.statusText.textContent = '实时同步已禁用';
        this.toggleBtn.textContent = '启用';
      }
      
      this.bookmarkCount.textContent = response.bookmarkCount || 0;
      this.lastSync.textContent = response.lastSync ? 
        new Date(response.lastSync).toLocaleTimeString('zh-CN') : '从未';
        
    } catch (error) {
      this.addLog('获取状态失败: ' + error.message, 'error');
    }
  }

  async toggleSync() {
    try {
      this.toggleBtn.disabled = true;
      
      const response = await chrome.runtime.sendMessage({ action: 'toggle_sync' });
      
      if (response.enabled) {
        this.addLog('✅ 实时同步已启用', 'success');
      } else {
        this.addLog('⏹️ 实时同步已禁用', 'info');
      }
      
      await this.updateStatus();
      
    } catch (error) {
      this.addLog('切换失败: ' + error.message, 'error');
    } finally {
      this.toggleBtn.disabled = false;
    }
  }

  async manualSync() {
    try {
      this.syncBtn.disabled = true;
      this.syncBtn.textContent = '同步中...';
      
      this.addLog('🔄 开始手动同步...', 'info');
      
      const response = await chrome.runtime.sendMessage({ action: 'manual_sync' });
      
      if (response.success) {
        this.addLog('✅ 手动同步完成', 'success');
        this.lastSync.textContent = new Date(response.timestamp).toLocaleTimeString('zh-CN');
      } else {
        this.addLog('❌ 同步失败: ' + response.error, 'error');
      }
      
    } catch (error) {
      this.addLog('同步失败: ' + error.message, 'error');
    } finally {
      this.syncBtn.disabled = false;
      this.syncBtn.textContent = '立即同步';
    }
  }

  handleBackgroundMessage(message) {
    switch (message.type) {
      case 'sync_completed':
        this.addLog(`✅ 自动同步完成 (${message.data.action})`, 'success');
        this.lastSync.textContent = new Date(message.data.timestamp).toLocaleTimeString('zh-CN');
        break;
        
      case 'sync_error':
        this.addLog(`❌ 同步错误: ${message.data.error}`, 'error');
        break;
    }
  }

  addLog(message, type = 'info') {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = `[${new Date().toLocaleTimeString('zh-CN')}] ${message}`;
    
    this.logArea.appendChild(entry);
    this.logArea.scrollTop = this.logArea.scrollHeight;
    
    // 限制日志条数
    const entries = this.logArea.querySelectorAll('.log-entry');
    if (entries.length > 20) {
      entries[0].remove();
    }
  }
}

// 启动弹窗控制器
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});