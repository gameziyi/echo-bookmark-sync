#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

/**
 * 检测Atlas应用的实际名称和路径
 */
async function detectAtlasApp() {
    console.log('🔍 检测 Atlas 应用信息...\n');
    
    const platform = process.platform;
    
    if (platform === 'darwin') {
        await detectMacOSAtlas();
    } else if (platform === 'win32') {
        await detectWindowsAtlas();
    } else {
        console.log('❌ 暂不支持此操作系统');
    }
}

async function detectMacOSAtlas() {
    console.log('📱 macOS 系统检测...');
    
    // 1. 检查Applications目录
    const appDirs = [
        '/Applications',
        '/Applications/Utilities',
        `${process.env.HOME}/Applications`
    ];
    
    console.log('\n1️⃣ 检查应用目录...');
    for (const dir of appDirs) {
        if (await fs.pathExists(dir)) {
            const files = await fs.readdir(dir);
            const atlasApps = files.filter(file => 
                file.toLowerCase().includes('atlas') || 
                file.toLowerCase().includes('chatgpt')
            );
            
            if (atlasApps.length > 0) {
                console.log(`   📂 ${dir}:`);
                atlasApps.forEach(app => {
                    console.log(`      → ${app}`);
                });
            }
        }
    }
    
    // 2. 使用系统命令查找
    console.log('\n2️⃣ 使用系统命令查找...');
    
    const commands = [
        'mdfind "kMDItemDisplayName == \'*Atlas*\'"',
        'mdfind "kMDItemDisplayName == \'*ChatGPT*\'"',
        'find /Applications -name "*Atlas*" -type d 2>/dev/null',
        'find /Applications -name "*ChatGPT*" -type d 2>/dev/null'
    ];
    
    for (const cmd of commands) {
        try {
            console.log(`   🔍 执行: ${cmd}`);
            const result = await execCommand(cmd);
            if (result.trim()) {
                console.log(`      结果: ${result.trim()}`);
            } else {
                console.log('      结果: 未找到');
            }
        } catch (error) {
            console.log(`      错误: ${error.message}`);
        }
    }
    
    // 3. 检查运行中的进程
    console.log('\n3️⃣ 检查运行中的进程...');
    try {
        const processes = await execCommand('ps aux | grep -i atlas | grep -v grep');
        if (processes.trim()) {
            console.log('   运行中的Atlas相关进程:');
            processes.split('\n').forEach(line => {
                if (line.trim()) {
                    console.log(`      → ${line.trim()}`);
                }
            });
        } else {
            console.log('   未找到运行中的Atlas进程');
        }
    } catch (error) {
        console.log('   无法检查进程');
    }
    
    // 4. 测试启动命令
    console.log('\n4️⃣ 测试启动命令...');
    const testCommands = [
        'open -a "Atlas"',
        'open -a "ChatGPT Atlas"',
        'open -a "com.openai.atlas"'
    ];
    
    for (const cmd of testCommands) {
        console.log(`   🧪 测试: ${cmd}`);
        try {
            await execCommand(cmd);
            console.log('      ✅ 命令执行成功');
            
            // 等待一下，然后检查是否启动
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const checkProcess = await execCommand('pgrep -f Atlas || pgrep -f ChatGPT');
            if (checkProcess.trim()) {
                console.log('      ✅ Atlas 已启动');
                return;
            } else {
                console.log('      ⚠️ 命令执行但应用未启动');
            }
        } catch (error) {
            console.log(`      ❌ 命令失败: ${error.message}`);
        }
    }
}

async function detectWindowsAtlas() {
    console.log('🪟 Windows 系统检测...');
    
    // Windows检测逻辑
    const possiblePaths = [
        'C:\\Program Files\\ChatGPT Atlas',
        'C:\\Program Files (x86)\\ChatGPT Atlas',
        `${process.env.USERPROFILE}\\AppData\\Local\\Programs\\ChatGPT Atlas`,
        `${process.env.USERPROFILE}\\AppData\\Local\\Atlas`
    ];
    
    console.log('\n1️⃣ 检查可能的安装路径...');
    for (const dir of possiblePaths) {
        if (await fs.pathExists(dir)) {
            console.log(`   ✅ 找到: ${dir}`);
            const files = await fs.readdir(dir);
            files.forEach(file => {
                console.log(`      → ${file}`);
            });
        } else {
            console.log(`   ❌ 不存在: ${dir}`);
        }
    }
}

function execCommand(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            } else {
                resolve(stdout);
            }
        });
    });
}

// 运行检测
detectAtlasApp().then(() => {
    console.log('\n🏁 检测完成');
}).catch(error => {
    console.error('❌ 检测失败:', error.message);
});