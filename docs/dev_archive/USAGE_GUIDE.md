# 📚 书签同步工具使用指南

## 快速开始

### 第一步：启动应用
```bash
cd bookmark-sync-tool
npm install
npm run dev
```

### 第二步：配置浏览器路径
1. **Chrome 路径**: 点击"自动检测"按钮，通常能自动找到
2. **ChatGPT Atlas 路径**: 需要手动指定，因为 Atlas 可能使用不同的存储方式

### 第三步：选择同步方向
- **双向同步** (推荐): 智能合并两个浏览器的书签
- **Chrome → Atlas**: 只将 Chrome 的书签同步到 Atlas
- **Atlas → Chrome**: 只将 Atlas 的书签同步到 Chrome

### 第四步：开始同步
- **自动同步**: 点击"启动自动同步"，实时监控文件变化
- **手动同步**: 点击"手动同步一次"，立即执行一次同步

## 详细功能说明

### 🔍 浏览器路径检测

#### Chrome 路径
应用会自动检测以下位置：
- **macOS**: `~/Library/Application Support/Google/Chrome/Default/Bookmarks`
- **Windows**: `%USERPROFILE%/AppData/Local/Google/Chrome/User Data/Default/Bookmarks`

#### ChatGPT Atlas 路径
由于 Atlas 可能使用不同的存储方式，需要手动查找：

**可能的位置：**
- **macOS**: 
  - `~/Library/Application Support/ChatGPT Atlas/bookmarks.json`
  - `~/Library/Application Support/OpenAI/ChatGPT Atlas/bookmarks.json`
- **Windows**: 
  - `%USERPROFILE%/AppData/Local/ChatGPT Atlas/bookmarks.json`
  - `%USERPROFILE%/AppData/Roaming/ChatGPT Atlas/bookmarks.json`

**如何查找 Atlas 书签文件：**
1. 打开 ChatGPT Atlas
2. 查看应用的设置或关于页面
3. 寻找数据存储位置信息
4. 或者搜索包含 "bookmarks" 的 JSON 文件

### 🔄 同步模式详解

#### 双向同步 (推荐)
- **工作原理**: 智能合并两个浏览器的书签
- **冲突处理**: 自动去重，保留所有唯一书签
- **适用场景**: 两个浏览器都在使用，希望保持一致

#### 单向同步
- **Chrome → Atlas**: 将 Chrome 的书签完全覆盖到 Atlas
- **Atlas → Chrome**: 将 Atlas 的书签完全覆盖到 Chrome
- **适用场景**: 有一个主要浏览器，另一个作为备用

### 📊 状态监控

#### 同步状态指示器
- **🟢 运行中**: 自动同步已启动，正在监控文件变化
- **⚫ 已停止**: 自动同步已停止
- **🔴 出错**: 同步过程中出现错误

#### 同步日志
- **成功**: 绿色显示，表示同步成功
- **错误**: 红色显示，显示错误信息
- **信息**: 蓝色显示，显示一般信息

## 🛠️ 故障排除

### 常见问题及解决方案

#### 1. 无法检测到 Chrome 路径
**可能原因：**
- Chrome 未安装
- Chrome 从未运行过
- 使用了便携版 Chrome

**解决方案：**
- 确保 Chrome 已正确安装
- 至少运行一次 Chrome 创建配置文件
- 手动浏览选择书签文件

#### 2. Atlas 路径检测失败
**可能原因：**
- Atlas 使用了不同的存储方式
- 书签文件位置不在预期路径

**解决方案：**
- 手动查找 Atlas 的数据目录
- 联系 Atlas 开发者获取书签文件位置
- 尝试导出 Atlas 书签为标准格式

#### 3. 同步失败
**可能原因：**
- 文件权限不足
- 书签文件格式不兼容
- 文件被其他程序占用

**解决方案：**
- 检查文件读写权限
- 关闭相关浏览器再尝试同步
- 查看详细错误日志

#### 4. 书签丢失或重复
**可能原因：**
- 同步过程中出现冲突
- 书签文件损坏

**解决方案：**
- 应用会自动创建备份文件 (*.backup.*)
- 从备份文件恢复
- 使用浏览器自带的书签恢复功能

### 📁 备份和恢复

#### 自动备份
- 每次写入书签文件前，应用会自动创建备份
- 备份文件格式: `原文件名.backup.时间戳`
- 备份文件保存在原文件同目录

#### 手动备份
建议定期手动备份重要书签：
1. 复制书签文件到安全位置
2. 使用浏览器导出书签功能
3. 云端同步服务备份

## 🚀 高级使用技巧

### 1. 定制同步策略
根据使用习惯选择合适的同步方向：
- 主要使用 Chrome：选择 Chrome → Atlas
- 主要使用 Atlas：选择 Atlas → Chrome
- 两者并用：选择双向同步

### 2. 监控同步效果
- 定期查看同步日志
- 注意同步时间和频率
- 及时处理同步错误

### 3. 性能优化
- 避免在同步过程中操作浏览器书签
- 定期清理过期的备份文件
- 关闭不必要的文件监控

## 📞 技术支持

如果遇到问题：
1. 查看应用内的同步日志
2. 检查 README.md 中的故障排除部分
3. 确保使用最新版本的应用
4. 提供详细的错误信息和系统环境

## 🔮 未来功能

计划中的功能：
- [ ] 支持更多浏览器 (Firefox, Safari, Edge)
- [ ] 书签冲突解决界面
- [ ] 定时同步功能
- [ ] 云端备份选项
- [ ] 书签分类和标签支持
- [ ] 同步历史记录
- [ ] 批量书签管理