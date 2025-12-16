class BookmarkSyncApp {
    constructor() {
        this.isRunning = false;
        this.config = {
            chromePath: '',
            atlasPath: '',
            syncDirection: 'bidirectional'
        };
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadConfig();
        this.detectBrowserPaths();
        this.setupSyncUpdateListener();
    }

    bindEvents() {
        // 检测按钮
        document.getElementById('detect-chrome').addEventListener('click', () => {
            this.detectBrowserPaths();
        });
        
        document.getElementById('detect-atlas').addEventListener('click', () => {
            this.detectBrowserPaths();
        });

        // 浏览按钮
        document.getElementById('browse-chrome').addEventListener('click', async () => {
            const path = await window.electronAPI.selectPath();
            if (path) {
                document.getElementById('chrome-path').value = path;
                this.config.chromePath = path;
                this.saveConfig();
            }
        });

        document.getElementById('browse-atlas').addEventListener('click', async () => {
            const path = await window.electronAPI.selectPath();
            if (path) {
                document.getElementById('atlas-path').value = path;
                this.config.atlasPath = path;
                this.saveConfig();
            }
        });

        // 帮助按钮
        document.getElementById('help-atlas').addEventListener('click', () => {
            this.toggleAtlasHelp();
        });

        // 同步方向
        document.querySelectorAll('input[name="sync-direction"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.config.syncDirection = e.target.value;
                this.saveConfig();
            });
        });

        // 同步控制
        document.getElementById('start-sync').addEventListener('click', () => {
            this.startSync();
        });

        document.getElementById('stop-sync').addEventListener('click', () => {
            this.stopSync();
        });

        document.getElementById('manual-sync').addEventListener('click', () => {
            this.manualSync();
        });

        // 清空日志
        document.getElementById('clear-log').addEventListener('click', () => {
            this.clearLog();
        });
    }

    async detectBrowserPaths() {
        try {
            this.addLog('正在检测浏览器路径...', 'info');
            const paths = await window.electronAPI.getBrowserPaths();
            
            if (paths.chrome) {
                document.getElementById('chrome-path').value = paths.chrome;
                this.config.chromePath = paths.chrome;
                this.addLog(`检测到 Chrome 路径: ${paths.chrome}`, 'success');
            } else {
                this.addLog('未检测到 Chrome 书签文件', 'error');
            }

            if (paths.atlas) {
                document.getElementById('atlas-path').value = paths.atlas;
                this.config.atlasPath = paths.atlas;
                this.addLog(`检测到 Atlas 路径: ${paths.atlas}`, 'success');
            } else {
                this.addLog('未检测到 ChatGPT Atlas 书签文件，点击"帮助"按钮查看查找指南', 'info');
            }

            this.saveConfig();
        } catch (error) {
            this.addLog(`检测失败: ${error.message}`, 'error');
        }
    }

    async toggleAtlasHelp() {
        const helpSection = document.getElementById('atlas-help');
        const isVisible = helpSection.style.display !== 'none';
        
        if (isVisible) {
            helpSection.style.display = 'none';
        } else {
            helpSection.style.display = 'block';
            
            // 加载路径建议
            try {
                const suggestions = await window.electronAPI.getAtlasSuggestions();
                const suggestionsContainer = document.getElementById('atlas-suggestions');
                
                if (suggestions && suggestions.length > 0) {
                    suggestionsContainer.innerHTML = `
                        <strong>在以下位置查找:</strong><br>
                        ${suggestions.map(path => `<span class="suggestion-path">${path}</span>`).join('')}
                    `;
                } else {
                    suggestionsContainer.innerHTML = '<em>无法获取路径建议</em>';
                }
            } catch (error) {
                console.error('获取路径建议失败:', error);
            }
        }
    }

    async startSync() {
        if (!this.validateConfig()) {
            return;
        }

        try {
            const result = await window.electronAPI.startSync(this.config);
            if (result.success) {
                this.isRunning = true;
                this.updateSyncStatus('running', '同步已启动');
                this.addLog('自动同步已启动', 'success');
                
                // 更新按钮状态
                document.getElementById('start-sync').disabled = true;
                document.getElementById('stop-sync').disabled = false;
            } else {
                this.addLog(`启动失败: ${result.message}`, 'error');
            }
        } catch (error) {
            this.addLog(`启动失败: ${error.message}`, 'error');
        }
    }

    async stopSync() {
        try {
            const result = await window.electronAPI.stopSync();
            if (result.success) {
                this.isRunning = false;
                this.updateSyncStatus('stopped', '同步已停止');
                this.addLog('自动同步已停止', 'info');
                
                // 更新按钮状态
                document.getElementById('start-sync').disabled = false;
                document.getElementById('stop-sync').disabled = true;
            }
        } catch (error) {
            this.addLog(`停止失败: ${error.message}`, 'error');
        }
    }

    async manualSync() {
        if (!this.validateConfig()) {
            return;
        }

        try {
            this.addLog('开始手动同步...', 'info');
            const result = await window.electronAPI.manualSync(this.config);
            
            if (result.success) {
                const { chromeUpdated, atlasUpdated } = result.result;
                let message = '手动同步完成';
                
                if (chromeUpdated && atlasUpdated) {
                    message += ' - Chrome 和 Atlas 都已更新';
                } else if (chromeUpdated) {
                    message += ' - Chrome 已更新';
                } else if (atlasUpdated) {
                    message += ' - Atlas 已更新';
                } else {
                    message += ' - 无需更新';
                }
                
                this.addLog(message, 'success');
                
                // 添加重要提示
                if (chromeUpdated || atlasUpdated) {
                    this.addLog('💡 重要提示: 请重启相关浏览器以查看同步的书签', 'info');
                    if (atlasUpdated) {
                        this.addLog('   - 重启 ChatGPT Atlas 浏览器查看新书签', 'info');
                    }
                    if (chromeUpdated) {
                        this.addLog('   - 重启 Chrome 浏览器查看新书签', 'info');
                    }
                }
                
                this.updateLastSyncTime();
            } else {
                this.addLog(`同步失败: ${result.message}`, 'error');
            }
        } catch (error) {
            this.addLog(`同步失败: ${error.message}`, 'error');
        }
    }

    validateConfig() {
        if (!this.config.chromePath) {
            this.addLog('请先设置 Chrome 书签路径', 'error');
            return false;
        }
        
        if (!this.config.atlasPath) {
            this.addLog('请先设置 ChatGPT Atlas 书签路径', 'error');
            return false;
        }
        
        return true;
    }

    setupSyncUpdateListener() {
        window.electronAPI.onSyncUpdate((data) => {
            const { type, message, timestamp, result } = data;
            
            if (type === 'success') {
                this.addLog(message, 'success');
                this.updateLastSyncTime();
            } else if (type === 'error') {
                this.addLog(message, 'error');
                this.updateSyncStatus('error', '同步出错');
            }
        });
    }

    updateSyncStatus(status, message) {
        const statusElement = document.getElementById('sync-status');
        statusElement.className = `status-badge status-${status}`;
        
        switch (status) {
            case 'running':
                statusElement.textContent = '运行中';
                break;
            case 'stopped':
                statusElement.textContent = '已停止';
                break;
            case 'error':
                statusElement.textContent = '出错';
                break;
        }
    }

    updateLastSyncTime() {
        const now = new Date();
        const timeString = now.toLocaleString('zh-CN');
        document.getElementById('last-sync-time').textContent = `最后同步: ${timeString}`;
    }

    addLog(message, type = 'info') {
        const logArea = document.getElementById('sync-log');
        const timestamp = new Date().toLocaleTimeString('zh-CN');
        
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.innerHTML = `
            <span class="log-timestamp">[${timestamp}]</span> ${message}
        `;
        
        logArea.appendChild(logEntry);
        logArea.scrollTop = logArea.scrollHeight;
        
        // 限制日志条数
        const entries = logArea.querySelectorAll('.log-entry');
        if (entries.length > 100) {
            entries[0].remove();
        }
    }

    clearLog() {
        document.getElementById('sync-log').innerHTML = '';
        this.addLog('日志已清空', 'info');
    }

    saveConfig() {
        localStorage.setItem('bookmarkSyncConfig', JSON.stringify(this.config));
    }

    loadConfig() {
        const saved = localStorage.getItem('bookmarkSyncConfig');
        if (saved) {
            this.config = { ...this.config, ...JSON.parse(saved) };
            
            // 恢复界面状态
            if (this.config.chromePath) {
                document.getElementById('chrome-path').value = this.config.chromePath;
            }
            
            if (this.config.atlasPath) {
                document.getElementById('atlas-path').value = this.config.atlasPath;
            }
            
            const directionRadio = document.querySelector(`input[name="sync-direction"][value="${this.config.syncDirection}"]`);
            if (directionRadio) {
                directionRadio.checked = true;
            }
        }
    }
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
    new BookmarkSyncApp();
});