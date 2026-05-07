#!/bin/bash

set -e

echo "🚀 启动旅行行程规划系统..."

DB_USER="dev"
DB_PASS="dev123456"
DB_NAME="db_zj_60054"
PG_CONTAINER="dev-postgres"

echo "📦 检查并创建数据库..."

DB_EXISTS=$(docker exec -e PGPASSWORD=$DB_PASS $PG_CONTAINER psql -U $DB_USER -t -c "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" 2>/dev/null || echo "")

if echo "$DB_EXISTS" | grep -q "1"; then
    echo "✅  数据库 $DB_NAME 已存在"
else
    echo "🗄️  数据库 $DB_NAME 不存在，正在创建..."
    docker exec -e PGPASSWORD=$DB_PASS $PG_CONTAINER psql -U $DB_USER -c "CREATE DATABASE $DB_NAME"
    echo "✅  数据库 $DB_NAME 创建成功"
fi

echo ""
echo "🐳 构建并启动 Docker 容器..."
echo "🌐 前端: http://localhost:16054"
echo "🔌 后端: http://localhost:13054"
echo ""

docker compose up --build
