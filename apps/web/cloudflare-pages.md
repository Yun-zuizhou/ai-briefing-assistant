# Cloudflare Pages 配置
# 在 Cloudflare Dashboard 中配置以下设置

# 构建设置
# Root Directory: apps/web
# Build Command: npm run build
# Build output directory: dist

# 环境变量
# 当前正式在线后端是 Cloudflare Workers：apps/edge-worker
# 推荐在 Pages 环境变量中显式设置：
# VITE_API_ORIGIN=https://ai-briefing-assistant.aibriefing2026.workers.dev
#
# 如果你在中国大陆访问，workers.dev 可能存在网络问题。
# 更稳妥的方式：
# 1. 给 Workers 绑定自定义域名，再把 VITE_API_ORIGIN 指向自定义域名
# 2. 或在 Pages 上配置同源代理，把 /api/* 转发到 Workers

# 重定向规则（可选，用于 API 代理）
# 在 Cloudflare Pages 设置中添加：
# /api/*  https://your-worker-or-custom-domain/api/:splat  200
