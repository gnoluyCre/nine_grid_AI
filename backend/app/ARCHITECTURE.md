一旦我所属的文件夹有所变化请更新我

# backend/app 目录说明

本目录是后端应用主源码区，负责 API 入口、数据库、服务编排和模型定义。  
路由从这里装配，服务和仓储也在这里汇总。  
子目录按职责拆分为 `api`、`services`、`repositories`、`schemas`、`adapters`。

| 文件名 | 地位 | 功能 |
| --- | --- | --- |
| `__init__.py` | 包入口 | 声明后端应用包 |
| `database.py` | 基础设施核心 | 管理 SQLite 初始化与连接 |
| `main.py` | 应用入口 | 创建 FastAPI 应用并装配依赖 |
| `runtime.py` | 运行时工具 | 提供项目根路径等运行时辅助 |

子目录提示：业务路由看 `api`，数据访问看 `repositories`，业务编排看 `services`，请求响应模型看 `schemas`。
