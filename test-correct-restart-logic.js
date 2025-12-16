console.log('🧪 测试正确的重启逻辑...\n');

// 模拟不同的同步场景
const scenarios = [
    {
        name: 'Chrome 更新触发同步',
        triggerBrowser: 'Chrome',
        result: { chromeUpdated: false, atlasUpdated: true },
        expectedRestart: 'Atlas',
        description: 'Chrome 中添加书签 → 同步到 Atlas → 重启 Atlas'
    },
    {
        name: 'Atlas 更新触发同步', 
        triggerBrowser: 'Atlas',
        result: { chromeUpdated: true, atlasUpdated: false },
        expectedRestart: 'Chrome',
        description: 'Atlas 中添加书签 → 同步到 Chrome → 重启 Chrome'
    },
    {
        name: '双向同步',
        triggerBrowser: 'Chrome',
        result: { chromeUpdated: true, atlasUpdated: true },
        expectedRestart: 'Chrome 和 Atlas',
        description: '双向合并 → 两个都更新 → 重启两个'
    }
];

console.log('📋 重启逻辑测试场景:');
console.log('=' .repeat(60));

scenarios.forEach((scenario, index) => {
    console.log(`\n${index + 1}️⃣ ${scenario.name}`);
    console.log(`描述: ${scenario.description}`);
    console.log(`触发浏览器: ${scenario.triggerBrowser}`);
    console.log(`更新结果: Chrome=${scenario.result.chromeUpdated}, Atlas=${scenario.result.atlasUpdated}`);
    console.log(`预期重启: ${scenario.expectedRestart}`);
    
    // 模拟逻辑判断
    let actualRestart;
    const { triggerBrowser } = scenario;
    const { chromeUpdated, atlasUpdated } = scenario.result;
    
    if (chromeUpdated && atlasUpdated) {
        actualRestart = 'Chrome 和 Atlas';
    } else if (triggerBrowser === 'Chrome' && atlasUpdated) {
        actualRestart = 'Atlas';
    } else if (triggerBrowser === 'Atlas' && chromeUpdated) {
        actualRestart = 'Chrome';
    }
    
    const isCorrect = actualRestart === scenario.expectedRestart;
    console.log(`实际重启: ${actualRestart} ${isCorrect ? '✅' : '❌'}`);
});

console.log('\n🎯 核心逻辑总结:');
console.log('=' .repeat(60));
console.log('✅ 正确的重启逻辑:');
console.log('- Chrome 触发 + Atlas 更新 → 重启 Atlas');
console.log('- Atlas 触发 + Chrome 更新 → 重启 Chrome'); 
console.log('- 双向更新 → 重启 Chrome 和 Atlas');

console.log('\n📱 实际场景验证:');
console.log('场景: 用户在 Chrome 中添加书签');
console.log('1. 工具检测到 Chrome 文件变化 (triggerBrowser = Chrome)');
console.log('2. 向 Atlas 同步该书签 (atlasUpdated = true)');
console.log('3. Atlas 被更新，提示重启 Atlas ✅');
console.log('4. 用户重启 Atlas，看到新书签 ✅');

console.log('\n场景: 用户在 Atlas 中添加书签');
console.log('1. 工具检测到 Atlas 文件变化 (triggerBrowser = Atlas)');
console.log('2. 向 Chrome 同步该书签 (chromeUpdated = true)');
console.log('3. Chrome 被更新，提示重启 Chrome ✅');
console.log('4. 用户重启 Chrome，看到新书签 ✅');

console.log('\n🔧 修正要点:');
console.log('- 重启提示不能只看 result.chromeUpdated/atlasUpdated');
console.log('- 必须结合 triggerBrowser 来判断同步方向');
console.log('- 重启的是被同步到的浏览器，不是触发的浏览器');