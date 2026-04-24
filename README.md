# 九宫格排盘系统

当前仓库是九宫格排盘系统的主版本代码库，包含独立算法模块、FastAPI 后端、React 前端以及配套文档，适合作为后续功能迭代和联调的主基线。

## 系统概览

项目围绕“出生信息录入 -> 真太阳时修正 -> 九宫格排盘 -> 结果展示/保存/导出”这一条主链路构建，当前已经形成一套可本地运行的完整系统：

- `nine_grid/`：独立核心算法包，支持命令行方式单独运行
- `backend/`：FastAPI 后端，负责排盘接口、账号体系、档案持久化、批量导出
- `frontend/`：React + Vite 前端，负责录入页、结果页、登录注册和档案管理
- `docs/`：算法说明与接口对接文档
- `assets/`：静态资源

## 当前功能

### 1. 排盘能力

- 支持按出生日期、出生时间、地区、性别进行排盘
- 按地区经度和均时差修正真太阳时
- 支持阳格 / 阴格切换展示
- 支持前子时 / 后子时双方案处理
- 支持农历闰月双方案处理
- 展示主魂、副魂、魄、半补、缺漏等结果信息
- 支持结果页在多方案之间切换查看

### 2. 前端业务能力

- 首页录入出生资料并提交真实后端接口
- 结果页展示九宫格盘面、指标概览和特殊提示条
- 支持访客模式直接排盘
- 登录后排盘结果可自动保存为个人档案
- 支持从档案回填编辑并覆盖原记录
- 支持档案详情查看、分页、搜索、删除、Excel 导出
- 支持首页批量导出指定日期区间的排盘结果并下载文件

### 3. 账号与后端能力

- 邮箱注册
- 邮箱验证码确认注册
- 邮箱登录 / 退出登录
- 忘记密码与验证码重置密码
- 当前登录用户信息查询与资料更新
- 基于 Cookie 的会话鉴权
- SQLite 本地持久化档案数据

### 4. 接口能力

后端当前提供的核心接口包括：

- 地区列表：`GET /api/v1/regions`
- 单次排盘：`POST /api/v1/charts`
- 首页批量导出：`POST /api/v1/batch-exports`
- 批量导出查询与下载：`GET /api/v1/batch-exports/{job_id}`、`GET /api/v1/batch-exports/{job_id}/download`
- 注册、登录、找回密码、当前用户：`/api/v1/auth/*`
- 档案增删改查与导出：`/api/v1/chart-records*`
- 健康检查：`GET /health`

## 技术栈

- 核心算法：Python
- 后端：FastAPI、Pydantic、Uvicorn、openpyxl
- 前端：React 18、TypeScript、Vite、React Router、Tailwind CSS
- 数据存储：SQLite

## 目录结构

```text
nine_grid/
├── assets/                      # 静态资源
├── backend/                     # FastAPI 后端
├── docs/                        # 算法与对接文档
├── frontend/                    # React 前端
├── nine_grid/                   # 独立算法包与 CLI
├── tests/                       # 算法与地区数据测试
├── .env.example                 # 环境变量示例
├── ARCHITECTURE.md              # 根目录维护说明
├── LICENSE
├── README.md
└── region.json                  # 地区树原始数据
```

## 本地运行

### 1. 后端

安装依赖：

```powershell
python -m pip install -r backend\requirements.txt
```

启动服务：

```powershell
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

启动后可访问：

- Swagger 文档：`http://127.0.0.1:8000/docs`
- 健康检查：`http://127.0.0.1:8000/health`

说明：

- 默认数据库路径为 `backend/data/nine_grid.sqlite3`
- 可通过 `NINE_GRID_DB_PATH` 覆盖数据库路径
- 可通过 `NINE_GRID_ALLOWED_ORIGINS` 覆盖允许跨域来源
- 可通过 `NINE_GRID_TEMP_DIR` 覆盖批量导出临时目录
- 后端启动时会自动初始化数据库表
- 后端会自动加载项目根目录下的 `.env` 或 `backend/.env`

### 2. 前端

安装依赖：

```powershell
cd frontend
npm install
```

启动开发环境：

```powershell
npm run dev
```

默认访问地址通常为：`http://127.0.0.1:5173`

### 3. 一键启动开发环境

如果你在 Windows 上本地开发，希望保留热更新但不想手动开两个终端，可执行：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\dev.ps1
```

脚本会分别打开前端和后端窗口：

- 后端：`http://127.0.0.1:8000`
- 前端：`http://127.0.0.1:5173`

可选参数：

- 仅启动后端：`.\scripts\dev.ps1 -BackendOnly`
- 仅启动前端：`.\scripts\dev.ps1 -FrontendOnly`

### 4. 使用 Docker Compose 稳定运行

如果你的目标是避免误关终端，并通过一个地址稳定访问整套系统，可执行：

```powershell
docker compose up -d --build
```

或直接执行：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\docker-up.ps1
```

启动后访问：

- Web 页面：`http://127.0.0.1:8080`
- 健康检查：`http://127.0.0.1:8080/health`

说明：

- 前端通过 Nginx 承载，并反向代理 `/api`、`/assets`、`/health` 到后端
- 后端 SQLite 数据挂载到 Docker 卷 `backend_data`
- 批量导出临时文件挂载到 Docker 卷 `backend_exports`
- 关闭当前终端后容器仍会继续运行

停止服务：

```powershell
docker compose down
```

也可直接执行：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\docker-down.ps1
```

查看日志：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\docker-logs.ps1
```

仅查看某个服务日志：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\docker-logs.ps1 backend
```

## 环境变量

如需启用邮箱注册/找回密码验证码能力，可在项目根目录创建 `.env`，参考 `.env.example`：

```env
NINE_GRID_SMTP_HOST=smtp.qq.com
NINE_GRID_SMTP_PORT=465
NINE_GRID_SMTP_USERNAME=your_mail@qq.com
NINE_GRID_SMTP_PASSWORD=your_smtp_authorization_code
NINE_GRID_MAIL_FROM=your_mail@qq.com
NINE_GRID_SMTP_USE_SSL=true
```

常用运行时变量：

- `NINE_GRID_ALLOWED_ORIGINS`：后端允许跨域来源，多个值用英文逗号分隔
- `NINE_GRID_DB_PATH`：SQLite 数据库文件路径
- `NINE_GRID_TEMP_DIR`：批量导出任务的临时文件目录
- `VITE_API_BASE_URL`：前端接口前缀；开发态通常留空，生产构建默认使用相对路径 `/api`

如果未正确配置 SMTP，涉及验证码发送的功能将无法正常工作。

## 独立算法命令行运行

除了 Web 系统外，核心算法也可以单独通过命令行运行：

```powershell
python -m nine_grid.cli
```

该模式适合直接验证地区选择、出生信息输入与单人排盘结果。

## 测试

可在仓库根目录执行：

```powershell
pytest
```

当前仓库包含：

- 根目录 `tests/`：核心算法与地区仓库测试
- `backend/tests/`：后端接口测试

## 文档索引

- 根目录维护说明：`ARCHITECTURE.md`
- 核心算法说明：`docs/九宫格核心算法.md`
- 前后端对接文档：`docs/算法对接文档.md`
- 其他目录架构说明：
  - `backend/ARCHITECTURE.md`
  - `backend/app/ARCHITECTURE.md`
  - `frontend/ARCHITECTURE.md`
  - `frontend/src/ARCHITECTURE.md`
  - `nine_grid/ARCHITECTURE.md`
  - `tests/ARCHITECTURE.md`

## 当前状态

当前版本已经具备完整的本地闭环能力：

- 核心排盘算法可独立运行
- 前后端已完成真实接口联调
- 账号、档案、导出等基础业务链路已落地
- 可作为后续 AI 解读、权限扩展和部署工作的稳定基线
