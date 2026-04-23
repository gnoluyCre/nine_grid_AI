一旦我所属的文件夹有所变化请更新我

# backend 目录说明

本目录承载后端运行时、依赖声明、测试配置与应用代码入口。  
API 服务、数据库访问和鉴权逻辑的源码位于 `app` 子目录。  
本目录只记录直接子文件职责，细节见 `backend/app/ARCHITECTURE.md`。

| 文件名 | 地位 | 功能 |
| --- | --- | --- |
| `pytest.ini` | 测试配置 | 定义后端 pytest 行为 |
| `requirements.txt` | 依赖清单 | 记录后端 Python 依赖 |

子目录提示：`app` 为后端主源码目录，`tests` 为接口级测试目录，`data` 为本地数据库文件目录。
