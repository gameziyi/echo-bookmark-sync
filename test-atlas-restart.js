#!/usr/bin/env node

const AtlasRestartHelper = require('./atlas-restart-helper');

console.log('🧪 测试 Atlas 重启功能...\n');

async function testAtlasRestart() {
    const helper = new AtlasRestartHelper();
    
    try {
        console.log('1️⃣ 检查 Atlas 运行状态...');
        const isRunning = await helper.isAtlasRunning();
        console.log(`   Atlas 当前状态: ${isRunning ? '✅ 运行中' : '❌ 未运行'}`);
        
        console.log('\n2️⃣ 测试完整重启流程...');
        const result = await helper.restartAtlas();
        
        if (result.success) {
            console.log('✅ 重启测试成功！');
            
            console.log('\n3️⃣ 验证重启后状态...');
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            const isRunningAfter = await helper.isAtlasRunning();
            console.log(`   重启后状态: ${isRunningAfter ? '✅ 运行中' : '❌ 未运行'}`);
            
            if (isRunningAfter) {
                console.log('\n🎉 Atlas 重启助手工作完全正常！');
                console.log('💡 现在可以在同步工具中使用一键重启功能');
            } else {
                console.log('\n⚠️ Atlas 可能启动失败，请检查应用路径');
            }
        } else {
            console.log(`❌ 重启测试失败: ${result.message}`);
            console.log('\n🔧 可能的解决方案:');
            console.log('- 检查 Atlas 是否正确安装');
            console.log('- 确认应用名称和路径正确');
            console.log('- 检查系统权限设置');
        }
        
    } catch (error) {
        console.error('❌ 测试过程出错:', error.message);
    }
}

// 运行测试
testAtlasRestart().then(() => {
    console.log('\n🏁 测试完成');
}).catch(error => {
    console.error('❌ 测试失败:', error.message);
});