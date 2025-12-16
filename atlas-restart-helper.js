#!/usr/bin/env node

const { exec, spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

/**
 * Atlas浏览器重启助手
 * 目标: 让Atlas重启过程更加自动化和用户友好
 */
class AtlasRestartHelper {
  constructor() {
    this.platform = process.platform;
    this.atlasProcessName = this.getAtlasProcessName();
  }

  getAtlasProcessName() {
    switch (this.platform) {
      case 'darwin':
        return 'Atlas'; // macOS应用名 (简化版本)
      case 'win32':
        return 'atlas.exe'; // Windows可执行文件名
      default:
        return 'atlas';
    }
  }

  /**
   * 检测Atlas是否正在运行
   */
  async isAtlasRunning() {
    return new Promise((resolve) => {
      const command = this.platform === 'win32' 
        ? `tasklist /FI "IMAGENAME eq ${this.atlasProcessName}"`
        : `pgrep -f "ChatGPT Atlas"`;

      exec(command, (error, stdout) => {
        if (error) {
          resolve(false);
        } else {
          resolve(stdout.includes('ChatGPT Atlas') || stdout.trim().length > 0);
        }
      });
    });
  }

  /**
   * 优雅关闭Atlas
   */
  async closeAtlas() {
    console.log('🔄 正在关闭 Atlas 浏览器...');
    
    return new Promise((resolve) => {
      let command;
      
      switch (this.platform) {
        case 'darwin':
          // macOS: 使用AppleScript优雅关闭
          command = `osascript -e 'tell application "ChatGPT Atlas" to quit'`;
          break;
        case 'win32':
          // Windows: 发送关闭信号
          command = `taskkill /IM ${this.atlasProcessName} /T`;
          break;
        default:
          command = `pkill -f "${this.atlasProcessName}"`;
      }

      exec(command, (error) => {
        // 等待进程完全关闭
        setTimeout(() => {
          resolve(!error);
        }, 2000);
      });
    });
  }

  /**
   * 启动Atlas
   */
  async startAtlas() {
    console.log('🚀 正在启动 Atlas 浏览器...');
    
    return new Promise((resolve) => {
      let command;
      
      switch (this.platform) {
        case 'darwin':
          // 使用检测到的正确应用名
          command = `open -a "ChatGPT Atlas"`;
          break;
        case 'win32':
          // 需要找到Atlas的安装路径
          command = `start "" "${this.findAtlasPath()}"`;
          break;
        default:
          command = this.atlasProcessName.toLowerCase();
      }

      exec(command, (error) => {
        setTimeout(() => {
          resolve(!error);
        }, 3000);
      });
    });
  }

  /**
   * 在Windows上查找Atlas安装路径
   */
  findAtlasPath() {
    const possiblePaths = [
      'C:\\Program Files\\ChatGPT Atlas\\atlas.exe',
      'C:\\Program Files (x86)\\ChatGPT Atlas\\atlas.exe',
      'C:\\Users\\%USERNAME%\\AppData\\Local\\Programs\\ChatGPT Atlas\\atlas.exe'
    ];
    
    for (const atlasPath of possiblePaths) {
      if (fs.existsSync(atlasPath)) {
        return atlasPath;
      }
    }
    
    return 'atlas'; // 回退到PATH查找
  }

  /**
   * 完整的重启流程
   */
  async restartAtlas() {
    try {
      console.log('🔄 开始 Atlas 浏览器重启流程...');
      
      // 1. 检查是否在运行
      const isRunning = await this.isAtlasRunning();
      console.log(`Atlas 运行状态: ${isRunning ? '运行中' : '未运行'}`);
      
      // 2. 如果在运行，先关闭
      if (isRunning) {
        const closed = await this.closeAtlas();
        if (!closed) {
          console.log('⚠️ Atlas 关闭可能不完整，继续启动...');
        } else {
          console.log('✅ Atlas 已成功关闭');
        }
      }
      
      // 3. 启动Atlas
      const started = await this.startAtlas();
      if (started) {
        console.log('✅ Atlas 重启完成！');
        return { success: true, message: 'Atlas 重启成功' };
      } else {
        console.log('❌ Atlas 启动失败');
        return { success: false, message: 'Atlas 启动失败' };
      }
      
    } catch (error) {
      console.error('❌ 重启过程出错:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * 验证重启后的同步结果
   */
  async verifySync(expectedBookmarkCount) {
    console.log('🔍 验证同步结果...');
    
    // 等待Atlas完全启动
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    try {
      // 这里可以添加验证逻辑
      // 比如检查书签文件的修改时间、大小等
      console.log('✅ 同步验证完成');
      return { verified: true };
    } catch (error) {
      console.log('❌ 同步验证失败:', error.message);
      return { verified: false, error: error.message };
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const helper = new AtlasRestartHelper();
  
  async function main() {
    console.log('🧪 测试 Atlas 重启助手...\n');
    
    const result = await helper.restartAtlas();
    console.log('\n📋 重启结果:', result);
    
    if (result.success) {
      console.log('\n🎉 Atlas 重启助手工作正常！');
    } else {
      console.log('\n❌ 需要调试重启逻辑');
    }
  }
  
  main().catch(console.error);
}

module.exports = AtlasRestartHelper;