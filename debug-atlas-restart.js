#!/usr/bin/env node

const AtlasRestartHelper = require('./atlas-restart-helper');

console.log('🔍 调试 Atlas 重启功能...\n');

async function debugAtlasRestart() {
    const helper = new AtlasRestartHelper();
    
    try {
        console.log('1️⃣ 检查当前 Atlas 状态...');
        const isRunningBefore = await helper.isAtlasRunning();
        console.log(`   Atlas 运行状态: ${isRunningBefore ? '✅ 运行中' : '❌ 未运行'}`);
        
        if (!isRunningBefore) {
            console.log('   ⚠️ Atlas 未运行，先启动 Atlas...');
            await helper.startAtlas();
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
        console.log('\n2️⃣ 测试关闭 Atlas...');
        const closeResult = await helper.closeAtlas();
        console.log(`   关闭结果: ${closeResult ? '✅ 成功' : '❌ 失败'}`);
        
        // 等待关闭完成
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('\n3️⃣ 验证 Atlas 是否已关闭...');
        const isRunningAfterClose = await helper.isAtlasRunning();
        console.log(`   关闭后状态: ${isRunningAfterClose ? '❌ 仍在运行' : '✅ 已关闭'}`);
        
        console.log('\n4️⃣ 测试启动 Atlas...');
        const startResult = await helper.startAtlas();
        console.log(`   启动结果: ${startResult ? '✅ 成功' : '❌ 失败'}`);
        
        // 等待启动完成
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        console.log('\n5️⃣ 验证 Atlas 是否已启动...');
        const isRunningAfterStart = await helper.isAtlasRunning();
        console.log(`   启动后状态: ${isRunningAfterStart ? '✅ 运行中' : '❌ 未运行'}`);
        
        console.log('\n📋 调试总结:');
        console.log(`- 初始状态: ${isRunningBefore ? '运行' : '未运行'}`);
        console.log(`- 关闭功能: ${closeResult ? '正常' : '异常'}`);
        console.log(`- 关闭验证: ${!isRunningAfterClose ? '成功' : '失败'}`);
        console.log(`- 启动功能: ${startResult ? '正常' : '异常'}`);
        console.log(`- 启动验证: ${isRunningAfterStart ? '成功' : '失败'}`);
        
        if (!closeResult || isRunningAfterClose) {
            console.log('\n🔧 关闭功能问题排查:');
            console.log('- 检查 AppleScript 权限');
            console.log('- 尝试手动执行: osascript -e \'tell application "ChatGPT Atlas" to quit\'');
        }
        
        if (!startResult || !isRunningAfterStart) {
            console.log('\n🔧 启动功能问题排查:');
            console.log('- 检查应用路径');
            console.log('- 尝试手动执行: open -a "ChatGPT Atlas"');
        }
        
    } catch (error) {
        console.error('❌ 调试过程出错:', error.message);
        console.log('\n🔧 可能的解决方案:');
        console.log('1. 检查系统权限设置');
        console.log('2. 确认 Atlas 应用路径正确');
        console.log('3. 尝试手动重启 Atlas');
    }
}

// 运行调试
debugAtlasRestart().then(() => {
    console.log('\n🏁 调试完成');
}).catch(error => {
    console.error('❌ 调试失败:', error.message);
});