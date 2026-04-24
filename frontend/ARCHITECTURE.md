一旦我所属的文件夹有所变化请更新我

# frontend 目录说明

本目录承载前端工程配置、构建配置与 Web 端源码。  
真正的页面、组件和状态逻辑位于 `src` 子目录。  
本目录只记录直接子文件职责，细节见 `frontend/src/ARCHITECTURE.md`。

| 文件名 | 地位 | 功能 |
| --- | --- | --- |
| `Dockerfile` | 运行镜像定义 | 构建前端静态资源并交给 Nginx 承载 |
| `index.html` | 页面壳入口 | 提供 Vite 挂载 HTML |
| `package.json` | 工程入口 | 定义前端脚本与依赖 |
| `package-lock.json` | 依赖锁定文件 | 固定 npm 安装版本 |
| `postcss.config.js` | 样式构建配置 | 装配 PostCSS 流程 |
| `tailwind.config.ts` | 设计系统配置 | 定义 Tailwind 主题扩展 |
| `tsconfig.json` | TS 根配置 | 汇总 TypeScript 编译规则 |
| `tsconfig.app.json` | 应用 TS 配置 | 约束前端源码编译 |
| `tsconfig.node.json` | Node TS 配置 | 约束构建脚本编译 |
| `vite.config.ts` | Vite 主配置 | 定义前端开发代理与打包行为 |
| `vite.config.js` | 构建产出配置 | 提供编译后的 JS 版本配置 |
| `vite.config.d.ts` | 声明产物 | 描述 Vite 配置类型 |
| `tsconfig.app.tsbuildinfo` | 编译缓存 | 保存应用 TS 构建信息 |
| `tsconfig.node.tsbuildinfo` | 编译缓存 | 保存 Node TS 构建信息 |

子目录提示：`src` 是前端主源码目录，`dist` 是打包产物，`node_modules` 是依赖目录。  
其中 `vite.config.ts` 负责把 `/api`、`/assets`、`/health` 代理到本地后端，保证开发态登录 cookie 走同源链路；`Dockerfile` 则用于 Docker Compose 交付场景，把打包后的前端交给 Nginx 并由反向代理转发后端接口。
