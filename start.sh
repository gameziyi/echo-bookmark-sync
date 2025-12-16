#!/bin/bash

echo "🚀 启动书签同步工具..."
echo "📁 当前目录: $(pwd)"
echo "📦 检查依赖..."

if [ ! -d "node_modules" ]; then
    echo "❌ 依赖未安装，正在安装..."
    npm install
fi

echo "✅ 依赖检查完成"
echo "🔧 启动开发模式..."

npm run dev