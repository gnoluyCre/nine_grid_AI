# input: 当前文件位置与项目目录结构约定。
# output: 项目根路径等运行时辅助函数。
# pos: 后端运行时公共工具层。
# 一旦我被更新务必更新我的开头注释以及所属文件夹的 md
from __future__ import annotations

import sys
from pathlib import Path


def ensure_project_root() -> Path:
    project_root = Path(__file__).resolve().parents[2]
    root_text = str(project_root)
    if root_text not in sys.path:
        sys.path.insert(0, root_text)
    return project_root
