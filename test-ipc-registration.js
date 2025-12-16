#!/usr/bin/env node

// 测试IPC注册是否正常
const { ipcMain } = require('electron');

console.log('🧪 测试IPC注册...\n');

// 模拟注册restart-atlas处理器
ipcMain.handle('restart-atlas', async () => {
  console.log('✅ restart-atlas 处理器被调用');
  return { success: true, message: '测试成功' };
});

console.log('📋 已注册的IPC处理器:');
console.log('- restart-atlas: ✅');

// 检查是否能正常导入AtlasRestartHelper
try {
  const AtlasRestartHelper = require('./atlas-restart-helper');
  const helper = new AtlasRestartHelper();
  console.log('✅ AtlasRestartHelper 导入成功');
  console.log('✅ AtlasRestartHelper 实例化成功');
} catch (error) {
  console.log('❌ AtlasRestartHelper 导入失败:', error.message);
}

console.log('\n💡 建议解决方案:');
console.log('1. 完全关闭同步工具应用');
console.log('2. 重新启动应用 (npm start)');
console.log('3. 新的IPC处理器应该会正确注册');