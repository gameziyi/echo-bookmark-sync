# 书签同步工具

一个跨平台的桌面应用，用于在 Chrome 浏览器和 ChatGPT Atlas 之间同步书签。

## 功能特点

- 🔄 **自动同步**: 实时监控书签文件变化，自动同步
- 🎯 **双向同步**: 支持双向同步、单向同步等多种模式
- 🖥️ **跨平台**: 支持 macOS 和 Windows 系统
- 🔒 **本地运行**: 无需服务器，数据完全本地处理
- 📊 **可视化界面**: 直观的用户界面和实时状态显示
- 📝 **详细日志**: 完整的同步日志记录

## 安装和使用

### 开发环境运行

1. 安装依赖:
```bash
cd bookmark-sync-tool
npm install
```

2. 启动开发模式:
```bash
npm run dev
```

### 构建发布版本

构建所有平台:
```bash
npm run build
```

构建 macOS 版本:
```bash
npm run build-mac
```

构建 Windows 版本:
```bash
npm run build-win
```

## 使用说明

1. **启动应用**: 运行应用后会自动检测 Chrome 书签路径
2. **配置 Atlas 路径**: 由于 ChatGPT Atlas 可能使用不同的存储方式，需要手动指定书签文件路径
3. **选择同步方向**: 
   - 双向同步 (推荐): 合并两个浏览器的书签
   - Chrome → Atlas: 只从 Chrome 同步到 Atlas
   - Atlas → Chrome: 只从 Atlas 同步到 Chrome
4. **启动同步**: 点击"启动自动同步"开始实时监控和同步

## 技术架构

- **Electron**: 跨平台桌面应用框架
- **Chokidar**: 文件监控库
- **Node.js**: 后端逻辑处理
- **HTML/CSS/JavaScript**: 用户界面

## 文件结构

```
bookmark-sync-tool/
├── src/
│   ├── main.js              # 主进程
│   ├── preload.js           # 预加载脚本
│   ├── bookmark-manager.js  # 书签管理核心逻辑
│   └── renderer/            # 渲染进程 (UI)
│       ├── index.html
│       ├── styles.css
│       └── app.js
├── assets/
│   └── icon.png            # 应用图标
├── package.json
└── README.md
```

## 注意事项

1. **备份重要**: 应用会自动创建书签文件备份，但建议手动备份重要书签
2. **路径检测**: Chrome 路径通常能自动检测，Atlas 路径可能需要手动指定
3. **权限要求**: 应用需要读写书签文件的权限
4. **同步冲突**: 双向同步时会智能合并，避免数据丢失

## 故障排除

### 常见问题

1. **无法检测到 Chrome 路径**
   - 确保 Chrome 已安装并至少运行过一次
   - 检查用户权限是否足够

2. **Atlas 路径检测失败**
   - ChatGPT Atlas 可能使用不同的存储方式
   - 尝试手动查找和指定书签文件位置

3. **同步失败**
   - 检查文件权限
   - 确保书签文件格式正确
   - 查看详细错误日志

## 开发计划

- [ ] 支持更多浏览器 (Firefox, Safari, Edge)
- [ ] 书签冲突解决界面
- [ ] 定时同步功能
- [ ] 云端备份选项
- [ ] 书签分类和标签支持

## 许可证

MIT License - 详见 LICENSE 文件

## 贡献

欢迎提交 Issue 和 Pull Request！