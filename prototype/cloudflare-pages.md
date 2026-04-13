# Cloudflare Pages 配置
# 在 Cloudflare Dashboard 中配置以下设置

# 构建设置
# Root Directory: prototype
# Build Command: npm run build
# Build output directory: dist

# 环境变量
# VITE_API_ORIGIN=https://your-backend-url.up.railway.app

# 重定向规则（可选，用于 API 代理）
# 在 Cloudflare Pages 设置中添加：
# /api/*  https://your-backend-url.up.railway.app/api/:splat  200
