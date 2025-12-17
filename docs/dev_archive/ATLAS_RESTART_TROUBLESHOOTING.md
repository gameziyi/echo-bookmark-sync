# Atlas重启功能故障排除指南

## 🚨 常见问题及解决方案

### 问题1: "No handler registered for 'restart-atlas'"
**原因**: 应用没有重启，新的IPC处理器未加载
**解决方案**:
1. 完全关闭同步工具应用
2. 重新运行 `npm start`
3. 新的重启功能应该可以正常使用

### 问题2: Atlas重启失败
**可能原因**:
- Atlas应用名称不匹配
- 权限不足
- Atlas未正确安装

**解决步骤**:
1. 确认Atlas已安装在 `/Applications/ChatGPT Atlas.app`
2. 测试手动启动: `open -a "ChatGPT Atlas"`
3. 检查系统权限设置

### 问题3: 重启后Atlas未启动
**检查方法**:
```bash
# 检查Atlas是否在运行
pgrep -f "ChatGPT Atlas"

# 手动启动Atlas
open -a "ChatGPT Atlas"
```

## 🧪 测试步骤

### 1. 测试Atlas检测
```bash
node test-atlas-restart.js
```

### 2. 测试应用重启功能
1. 启动同步工具
2. 点击"🔄 重启 Atlas"按钮
3. 观察日志输出

### 3. 验证重启结果
1. 检查Atlas是否重新启动
2. 验证书签是否正确同步
3. 确认重启提示消失

## 🔧 手动重启Atlas (备用方案)

如果自动重启失败，可以手动执行:

### macOS:
```bash
# 关闭Atlas
osascript -e 'tell application "ChatGPT Atlas" to quit'

# 启动Atlas
open -a "ChatGPT Atlas"
```

### Windows:
```cmd
# 关闭Atlas
taskkill /IM atlas.exe /T

# 启动Atlas (需要找到正确路径)
start "" "C:\Program Files\ChatGPT Atlas\atlas.exe"
```

## 📋 状态检查命令

### 检查Atlas进程:
```bash
ps aux | grep -i atlas | grep -v grep
```

### 检查同步工具进程:
```bash
ps aux | grep -i electron | grep bookmark
```

## 💡 最佳实践

1. **重启应用后测试**: 每次修改代码后都要重启应用
2. **检查日志**: 观察同步日志中的错误信息
3. **逐步测试**: 先测试Atlas检测，再测试重启功能
4. **备用方案**: 如果自动重启失败，使用手动重启

## 🎯 预期行为

正常工作时应该看到:
```
[23:47:38] 🔄 正在重启 Atlas 浏览器...
[23:47:40] ✅ Atlas 浏览器重启成功！
[23:47:40] 💡 请检查 Atlas 中的书签是否已更新
```

如果看到错误，请按照上述步骤进行排查。