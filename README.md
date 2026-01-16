# GPT 团队管理器

一个用于统一管理多个 OpenAI GPT 团队账号的 Web 应用程序，具备自动邀请成员功能。

## 功能特性

- **集中式团队管理**：通过单一仪表板管理多个 OpenAI 团队账号
- **自动化邀请**：使用浏览器自动化批量邀请成员
- **安全凭据存储**：使用 AES-256-GCM 加密存储密码
- **进度追踪**：实时监控邀请任务状态
- **成员管理**：追踪邀请状态和成员列表
- **统计仪表板**：概览团队、成员和邀请成功率

## 技术栈

- **框架**：Next.js 14+ (App Router) + TypeScript
- **数据库**：SQLite (开发环境) / PostgreSQL (生产环境) + Prisma ORM
- **自动化**：Puppeteer + stealth 插件
- **UI**：Tailwind CSS + shadcn/ui
- **验证**：Zod

## 项目结构

```
team-project/
├── prisma/
│   ├── schema.prisma          # 数据库模型
│   └── migrations/            # 数据库迁移文件
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/              # API 路由
│   │   ├── dashboard/        # 仪表板页面
│   │   ├── teams/            # 团队管理页面
│   │   └── page.tsx          # 首页
│   ├── components/           # React 组件
│   │   └── ui/              # shadcn/ui 基础组件
│   └── lib/                 # 核心业务逻辑
│       ├── automation/      # 浏览器自动化
│       ├── services/        # 业务服务层
│       └── utils/           # 工具函数（加密、验证）
└── .env                     # 环境变量文件
```

## 快速开始

### 前置条件

- Node.js 18+
- npm 或 yarn

### 安装步骤

1. 克隆仓库：
```bash
git clone <你的仓库地址>
cd team-project
```

2. 安装依赖：
```bash
npm install
```

3. 配置环境变量：

项目已创建 `.env` 文件并设置了默认值，根据需要更新：

```env
DATABASE_URL="file:./dev.db"
ENCRYPTION_KEY="<你的32字节十六进制密钥>"
NEXTAUTH_SECRET="<你的密钥>"
NEXTAUTH_URL="http://localhost:3000"
```

4. 初始化数据库：
```bash
npx prisma generate
npx prisma migrate dev
```

5. 启动开发服务器：
```bash
npm run dev
```

6. 在浏览器中打开 [http://localhost:3000](http://localhost:3000)

## 使用指南

### 添加团队

1. 导航到团队页面
2. 点击「添加团队」
3. 输入团队信息：
   - 团队名称
   - 邮箱（OpenAI 账号邮箱）
   - 密码（将被加密存储）
   - 可选：团队 URL、描述、标签
4. 点击「创建团队」

### 验证账号凭据

1. 进入团队详情页面
2. 点击「验证凭据」
3. 系统将尝试使用存储的凭据登录 OpenAI

### 邀请成员

1. 导航到团队详情页面
2. 点击「邀请成员」
3. 输入邮箱地址（每行一个或用逗号分隔）
4. 点击「开始邀请」
5. 实时监控邀请进度

### 查看统计

- 仪表板显示整体统计数据
- 每个团队页面显示该团队的详细统计
- 团队详情页面提供邀请历史记录

## API 接口

### 团队管理

- `GET /api/teams` - 获取所有团队
- `POST /api/teams` - 创建团队
- `GET /api/teams/:id` - 获取团队详情
- `PUT /api/teams/:id` - 更新团队信息
- `DELETE /api/teams/:id` - 删除团队
- `POST /api/teams/:id/verify` - 验证账号凭据
- `POST /api/teams/:id/sync` - 同步成员列表

### 成员管理

- `GET /api/members?teamId=xxx` - 获取团队成员列表
- `POST /api/members` - 添加成员
- `DELETE /api/members/:id` - 删除成员

### 邀请管理

- `GET /api/invites?teamId=xxx` - 获取邀请任务列表
- `POST /api/invites` - 创建邀请任务
- `GET /api/invites/:id` - 获取任务详情

## 安全注意事项

1. **密码加密**：所有团队密码在存储前使用 AES-256-GCM 加密
2. **环境变量**：敏感数据存储在 `.env` 文件中（不提交到 Git）
3. **浏览器自动化**：使用 stealth 插件避免被检测
4. **请求限流**：可配置的邀请间隔，避免触发限制

## 重要说明

### OpenAI 界面更新

浏览器自动化依赖 OpenAI 当前的界面结构。如果 OpenAI 更新了界面：

1. `src/lib/automation/openai-client.ts` 中的选择器可能需要更新
2. 在生产环境使用前进行充分测试
3. 考虑实现备用策略

### 合规性

- 确保遵守 OpenAI 的服务条款
- 负责任地使用自动化功能
- 本工具仅用于合法的团队管理目的

### 性能

- 浏览器自动化消耗较多资源
- 浏览器池限制并发操作数量（默认：5）
- 使用无头模式减少资源占用
- 大规模操作考虑使用专用服务器

## 开发指南

### 运行测试
```bash
# 根据需要添加测试
npm test
```

### 构建生产版本
```bash
npm run build
npm start
```

### 数据库管理
```bash
# 在 Prisma Studio 中查看数据库
npx prisma studio

# 创建新的迁移
npx prisma migrate dev --name <迁移名称>

# 重置数据库
npx prisma migrate reset
```

## 故障排除

### 数据库问题
- 确保 DATABASE_URL 设置正确
- 架构变更后运行 `npx prisma generate`
- 检查 SQLite 数据库文件的权限

### 浏览器自动化问题
- 验证 Chromium 已安装（Puppeteer 应自动安装）
- 检查系统资源是否充足（浏览器启动失败时）
- 调试时启用 headless: false

### API 错误
- 查看浏览器控制台获取详细错误信息
- 验证 API 接口是否可访问
- 确保数据库已正确迁移

## 未来规划

- [ ] NextAuth 认证系统
- [ ] 高级统计和报告功能
- [ ] 导出功能
- [ ] 任务队列（BullMQ/Redis）
- [ ] 多语言支持
- [ ] 邮件通知
- [ ] Webhook 集成

## 许可证

MIT License

## 支持

如有问题和建议，请在 GitHub 上提交 Issue。
