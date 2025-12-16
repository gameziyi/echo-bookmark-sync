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
        this.performStartupCheck();
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

        // Atlas重启助手
        document.getElementById('restart-atlas').addEventListener('click', () => {
            this.restartAtlas();
        });
    }

    async detectBrowserPaths() {
        try {
            const paths = await window.electronAPI.getBrowserPaths();
            let detectedCount = 0;
            
            if (paths.chrome) {
                document.getElementById('chrome-path').value = paths.chrome;
                this.config.chromePath = paths.chrome;
                detectedCount++;
            }

            if (paths.atlas) {
                document.getElementById('atlas-path').value = paths.atlas;
                this.config.atlasPath = paths.atlas;
                detectedCount++;
            }

            // 只记录检测结果摘要
            if (detectedCount === 2) {
                this.addLog('✅ Chrome 和 Atlas 路径检测成功', 'success');
            } else if (detectedCount === 1) {
                if (paths.chrome) {
                    this.addLog('✅ Chrome 路径检测成功，Atlas 需手动配置', 'info');
                } else {
                    this.addLog('✅ Atlas 路径检测成功，Chrome 需手动配置', 'info');
                }
            } else {
                this.addLog('⚠️ 未检测到浏览器路径，请手动配置', 'info');
            }

            this.saveConfig();
        } catch (error) {
            this.addLog(`❌ 路径检测失败: ${error.message}`, 'error');
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
                this.addLog('🚀 自动同步已启动，正在监控文件变化...', 'success');
                
                // 更新按钮状态
                document.getElementById('start-sync').disabled = true;
                document.getElementById('stop-sync').disabled = false;
            } else {
                this.addLog(`❌ 启动失败: ${result.message}`, 'error');
            }
        } catch (error) {
            this.addLog(`❌ 启动失败: ${error.message}`, 'error');
        }
    }

    async stopSync() {
        try {
            const result = await window.electronAPI.stopSync();
            if (result.success) {
                this.isRunning = false;
                this.updateSyncStatus('stopped', '同步已停止');
                this.addLog('⏹️ 自动同步已停止', 'info');
                
                // 更新按钮状态
                document.getElementById('start-sync').disabled = false;
                document.getElementById('stop-sync').disabled = true;
            }
        } catch (error) {
            this.addLog(`❌ 停止失败: ${error.message}`, 'error');
        }
    }

    async manualSync() {
        if (!this.validateConfig()) {
            return;
        }

        try {
            const result = await window.electronAPI.manualSync(this.config);
            
            if (result.success) {
                const { chromeUpdated, atlasUpdated, beforeSync, syncedItems } = result.result;
                
                // 显示同步前的差异分析
                if (beforeSync && beforeSync.differences.needsSync) {
                    this.addLog('🔍 手动同步 - 发现需要同步的内容:', 'info');
                    
                    if (beforeSync.differences.onlyInChrome.length > 0) {
                        this.addLog(`📱 Chrome 独有书签 (${beforeSync.differences.onlyInChrome.length} 个):`, 'info');
                        beforeSync.differences.onlyInChrome.slice(0, 2).forEach(bookmark => {
                            this.addLog(`   → ${bookmark.name} - ${bookmark.url}`, 'info');
                        });
                        if (beforeSync.differences.onlyInChrome.length > 2) {
                            this.addLog(`   → ... 还有 ${beforeSync.differences.onlyInChrome.length - 2} 个书签`, 'info');
                        }
                    }
                    
                    if (beforeSync.differences.onlyInAtlas.length > 0) {
                        this.addLog(`🌐 Atlas 独有书签 (${beforeSync.differences.onlyInAtlas.length} 个):`, 'info');
                        beforeSync.differences.onlyInAtlas.slice(0, 2).forEach(bookmark => {
                            this.addLog(`   → ${bookmark.name} - ${bookmark.url}`, 'info');
                        });
                        if (beforeSync.differences.onlyInAtlas.length > 2) {
                            this.addLog(`   → ... 还有 ${beforeSync.differences.onlyInAtlas.length - 2} 个书签`, 'info');
                        }
                    }
                }
                
                // 只记录有实际变更的操作
                if (chromeUpdated || atlasUpdated) {
                    this.addLog('📝 手动同步完成:', 'success');
                    
                    // 显示时间戳信息
                    if (result.result.fileModTimes) {
                        const { chrome, atlas, chromeIsNewer } = result.result.fileModTimes;
                        const chromeTime = new Date(chrome).toLocaleString('zh-CN');
                        const atlasTime = new Date(atlas).toLocaleString('zh-CN');
                        this.addLog(`⏰ 文件时间戳: Chrome(${chromeTime}) ${chromeIsNewer ? '🆕' : ''} | Atlas(${atlasTime}) ${!chromeIsNewer ? '🆕' : ''}`, 'info');
                    }
                    
                    // 显示具体同步的内容
                    if (syncedItems && syncedItems.totalSynced > 0) {
                        // 新增操作
                        if (syncedItems.addedToChrome.length > 0) {
                            this.addLog(`📥 向 Chrome 添加了 ${syncedItems.addedToChrome.length} 个书签:`, 'success');
                            syncedItems.addedToChrome.slice(0, 2).forEach(bookmark => {
                                this.addLog(`   ➕ ${bookmark.name} - ${bookmark.url}`, 'info');
                            });
                            if (syncedItems.addedToChrome.length > 2) {
                                this.addLog(`   ➕ ... 还有 ${syncedItems.addedToChrome.length - 2} 个书签`, 'info');
                            }
                        }
                        
                        if (syncedItems.addedToAtlas.length > 0) {
                            this.addLog(`📥 向 Atlas 添加了 ${syncedItems.addedToAtlas.length} 个书签:`, 'success');
                            syncedItems.addedToAtlas.slice(0, 2).forEach(bookmark => {
                                this.addLog(`   ➕ ${bookmark.name} - ${bookmark.url}`, 'info');
                            });
                            if (syncedItems.addedToAtlas.length > 2) {
                                this.addLog(`   ➕ ... 还有 ${syncedItems.addedToAtlas.length - 2} 个书签`, 'info');
                            }
                        }
                        
                        // 删除操作
                        if (syncedItems.removedFromChrome && syncedItems.removedFromChrome.length > 0) {
                            this.addLog(`🗑️ 从 Chrome 删除了 ${syncedItems.removedFromChrome.length} 个书签:`, 'info');
                            syncedItems.removedFromChrome.slice(0, 2).forEach(bookmark => {
                                this.addLog(`   ➖ ${bookmark.name} - ${bookmark.url}`, 'info');
                            });
                            if (syncedItems.removedFromChrome.length > 2) {
                                this.addLog(`   ➖ ... 还有 ${syncedItems.removedFromChrome.length - 2} 个书签`, 'info');
                            }
                        }
                        
                        if (syncedItems.removedFromAtlas && syncedItems.removedFromAtlas.length > 0) {
                            this.addLog(`🗑️ 从 Atlas 删除了 ${syncedItems.removedFromAtlas.length} 个书签:`, 'info');
                            syncedItems.removedFromAtlas.slice(0, 2).forEach(bookmark => {
                                this.addLog(`   ➖ ${bookmark.name} - ${bookmark.url}`, 'info');
                            });
                            if (syncedItems.removedFromAtlas.length > 2) {
                                this.addLog(`   ➖ ... 还有 ${syncedItems.removedFromAtlas.length - 2} 个书签`, 'info');
                            }
                        }
                    }
                    
                    // 明确指出需要重启的浏览器（被同步到的浏览器）
                    if (chromeUpdated && atlasUpdated) {
                        this.addLog('💡 请重启 Chrome 和 Atlas 浏览器查看同步结果', 'info');
                    } else if (chromeUpdated) {
                        // Chrome 被更新了，需要重启 Chrome
                        this.addLog('💡 请重启 Chrome 浏览器查看同步结果', 'info');
                    } else if (atlasUpdated) {
                        // Atlas 被更新了，需要重启 Atlas
                        this.addLog('💡 请重启 Atlas 浏览器查看同步结果', 'info');
                    }
                    
                    this.updateLastSyncTime();
                } else {
                    // 无变更时不记录日志，只更新时间戳
                    this.updateLastSyncTime();
                }
            } else {
                this.addLog(`❌ 同步失败: ${result.message}`, 'error');
            }
        } catch (error) {
            this.addLog(`❌ 同步失败: ${error.message}`, 'error');
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
            const { type, message, timestamp, result, triggerBrowser } = data;
            
            if (type === 'success') {
                // 只记录有实际变更的自动同步
                if (result && (result.chromeUpdated || result.atlasUpdated)) {
                    // 1. 说明触发原因和检测到的更新
                    this.addLog(`🔄 检测到 ${triggerBrowser} 浏览器书签更新`, 'success');
                    
                    // 显示最新的书签（可能是触发同步的书签）
                    if (result.latestBookmarks) {
                        const latestInTrigger = triggerBrowser === 'Chrome' ? 
                            result.latestBookmarks.chrome : result.latestBookmarks.atlas;
                        
                        if (latestInTrigger && latestInTrigger.length > 0) {
                            const latest = latestInTrigger[0]; // 显示最新的一个
                            this.addLog(`   → 更新内容: ${latest.name} - ${latest.url}`, 'info');
                        }
                    }
                    
                    // 2. 说明同步方向
                    const targetBrowser = triggerBrowser === 'Chrome' ? 'Atlas' : 'Chrome';
                    this.addLog(`📤 向 ${targetBrowser} 浏览器进行同步`, 'info');
                    
                    // 显示时间戳信息
                    if (result.fileModTimes) {
                        const { chromeIsNewer } = result.fileModTimes;
                        this.addLog(`⏰ 基于时间戳优先: ${chromeIsNewer ? 'Chrome 更新' : 'Atlas 更新'}`, 'info');
                    }
                    
                    // 3. 显示同步的具体内容
                    if (result.syncedItems && result.syncedItems.totalSynced > 0) {
                        // 新增操作
                        if (triggerBrowser === 'Chrome' && result.syncedItems.addedToAtlas.length > 0) {
                            this.addLog(`📥 向 Atlas 添加了 ${result.syncedItems.addedToAtlas.length} 个书签:`, 'success');
                            result.syncedItems.addedToAtlas.slice(0, 2).forEach(bookmark => {
                                this.addLog(`   ➕ ${bookmark.name} - ${bookmark.url}`, 'info');
                            });
                            if (result.syncedItems.addedToAtlas.length > 2) {
                                this.addLog(`   ➕ ... 还有 ${result.syncedItems.addedToAtlas.length - 2} 个书签`, 'info');
                            }
                        }
                        
                        if (triggerBrowser === 'Atlas' && result.syncedItems.addedToChrome.length > 0) {
                            this.addLog(`📥 向 Chrome 添加了 ${result.syncedItems.addedToChrome.length} 个书签:`, 'success');
                            result.syncedItems.addedToChrome.slice(0, 2).forEach(bookmark => {
                                this.addLog(`   ➕ ${bookmark.name} - ${bookmark.url}`, 'info');
                            });
                            if (result.syncedItems.addedToChrome.length > 2) {
                                this.addLog(`   ➕ ... 还有 ${result.syncedItems.addedToChrome.length - 2} 个书签`, 'info');
                            }
                        }
                        
                        // 删除操作
                        if (triggerBrowser === 'Chrome' && result.syncedItems.removedFromAtlas && result.syncedItems.removedFromAtlas.length > 0) {
                            this.addLog(`🗑️ 从 Atlas 删除了 ${result.syncedItems.removedFromAtlas.length} 个书签:`, 'info');
                            result.syncedItems.removedFromAtlas.slice(0, 2).forEach(bookmark => {
                                this.addLog(`   ➖ ${bookmark.name} - ${bookmark.url}`, 'info');
                            });
                        }
                        
                        if (triggerBrowser === 'Atlas' && result.syncedItems.removedFromChrome && result.syncedItems.removedFromChrome.length > 0) {
                            this.addLog(`🗑️ 从 Chrome 删除了 ${result.syncedItems.removedFromChrome.length} 个书签:`, 'info');
                            result.syncedItems.removedFromChrome.slice(0, 2).forEach(bookmark => {
                                this.addLog(`   ➖ ${bookmark.name} - ${bookmark.url}`, 'info');
                            });
                        }
                    }
                    
                    // 4. 明确指出需要重启的浏览器（被同步到的浏览器）
                    if (result.chromeUpdated && result.atlasUpdated) {
                        this.addLog('💡 请重启 Chrome 和 Atlas 浏览器查看同步结果', 'info');
                    } else if (triggerBrowser === 'Chrome' && result.atlasUpdated) {
                        // Chrome 触发，Atlas 被更新，需要重启 Atlas
                        this.addLog('💡 请重启 Atlas 浏览器查看同步结果', 'info');
                    } else if (triggerBrowser === 'Atlas' && result.chromeUpdated) {
                        // Atlas 触发，Chrome 被更新，需要重启 Chrome
                        this.addLog('💡 请重启 Chrome 浏览器查看同步结果', 'info');
                    }
                }
                this.updateLastSyncTime();
            } else if (type === 'error') {
                this.addLog(`❌ ${triggerBrowser} 浏览器自动同步错误: ${message}`, 'error');
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

    async performStartupCheck() {
        this.addLog('🚀 书签同步工具启动中...', 'info');
        
        // 1. 检测浏览器路径
        await this.detectBrowserPaths();
        
        // 2. 分析书签状态
        if (this.config.chromePath && this.config.atlasPath) {
            await this.analyzeBookmarkStatus();
        } else {
            this.addLog('⚠️ 需要配置浏览器路径才能分析书签状态', 'info');
            if (!this.config.chromePath) {
                this.addLog('   → Chrome 路径未配置，请点击"自动检测"或"浏览"', 'info');
            }
            if (!this.config.atlasPath) {
                this.addLog('   → Atlas 路径未配置，请点击"自动检测"或"浏览"', 'info');
            }
        }
    }

    async analyzeBookmarkStatus() {
        try {
            this.addLog('📊 正在分析书签状态...', 'info');
            
            const result = await window.electronAPI.analyzeBookmarks({
                chromePath: this.config.chromePath,
                atlasPath: this.config.atlasPath
            });
            
            if (result.success) {
                const { chromeStats, atlasStats, differences } = result.data;
                
                // 显示Chrome书签统计
                this.addLog(`📱 Chrome 书签统计:`, 'success');
                this.addLog(`   → 总书签: ${chromeStats.totalBookmarks} 个`, 'info');
                this.addLog(`   → 文件夹: ${chromeStats.totalFolders} 个`, 'info');
                this.addLog(`   → 书签栏: ${chromeStats.bookmarkBarItems} 项`, 'info');
                this.addLog(`   → 其他书签: ${chromeStats.otherBookmarksItems} 项`, 'info');
                
                // 显示Atlas书签统计
                this.addLog(`🌐 Atlas 书签统计:`, 'success');
                this.addLog(`   → 总书签: ${atlasStats.totalBookmarks} 个`, 'info');
                this.addLog(`   → 文件夹: ${atlasStats.totalFolders} 个`, 'info');
                this.addLog(`   → 书签栏: ${atlasStats.bookmarkBarItems} 项`, 'info');
                this.addLog(`   → 其他书签: ${atlasStats.otherBookmarksItems} 项`, 'info');
                
                // 显示差异分析
                if (differences.needsSync) {
                    this.addLog(`🔍 发现书签差异:`, 'info');
                    if (differences.onlyInChrome.length > 0) {
                        this.addLog(`   → Chrome 独有: ${differences.onlyInChrome.length} 个书签`, 'info');
                    }
                    if (differences.onlyInAtlas.length > 0) {
                        this.addLog(`   → Atlas 独有: ${differences.onlyInAtlas.length} 个书签`, 'info');
                    }
                    this.addLog(`   → 共同书签: ${differences.common.length} 个`, 'info');
                    this.addLog('💡 建议执行同步以保持书签一致', 'info');
                } else {
                    this.addLog('✅ 两个浏览器的书签已同步', 'success');
                }
            }
        } catch (error) {
            this.addLog(`❌ 书签分析失败: ${error.message}`, 'error');
        }
    }

    async restartAtlas() {
        try {
            this.addLog('🔄 正在重启 Atlas 浏览器...', 'info');
            
            const result = await window.electronAPI.restartAtlas();
            
            if (result.success) {
                this.addLog('✅ Atlas 浏览器重启成功！', 'success');
                this.addLog('💡 请检查 Atlas 中的书签是否已更新', 'info');
            } else {
                this.addLog(`❌ Atlas 重启失败: ${result.message}`, 'error');
            }
        } catch (error) {
            this.addLog(`❌ 重启失败: ${error.message}`, 'error');
        }
    }

    clearLog() {
        document.getElementById('sync-log').innerHTML = '';
        // 清空日志后不需要记录日志信息
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