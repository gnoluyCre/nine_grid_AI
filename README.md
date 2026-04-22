# 九宫格排盘系统

当前仓库是九宫格排盘系统的主版本代码库，包含：

- `nine_grid/`：核心算法模块
- `backend/`：FastAPI 后端接口
- `frontend/`：前端页面与结果展示
- `docs/`：接口文档、算法说明、联调记录

## 当前状态

当前版本已经完成：

- 核心九宫格算法落地
- 前后端真实接口联调
- 阳格 / 阴格切换
- 前后子时双方案
- 农历闰月处理
- 主魂 / 副魂 / 魄 / 缺漏 / 半补展示

这一版可以作为后续需求迭代的主版本基线。

## 目录说明

```text
nine_grid/
├── backend/
├── docs/
├── frontend/
├── nine_grid/
├── scripts/
├── tests/
├── region.json
├── README.md
└── 算法对接文档.md
```

## 本地运行

后端：

```powershell
python -m pip install -r backend\requirements.txt
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

前端：

```powershell
cd frontend
npm install
npm run dev
```

## 测试

算法回归：

```powershell
python tests\test_cases.py
```

后端接口测试：

```powershell
python -m pytest backend\tests\test_api.py -q -c backend\pytest.ini
```

前端构建检查：

```powershell
cd frontend
npm run build
```

## 文档

- 算法说明：`docs/nine-grid-algorithm-guide.md`
- 后端接口契约：`docs/backend-api-contract.md`
- 前后端接口对接：`算法对接文档.md`
- 联调回归记录：`docs/integration-regression-report-2026-04-22.md`
