# input: Pydantic BaseModel 与错误响应字段约定。
# output: 标准错误响应模型。
# pos: 后端错误返回的统一数据模型。
# 一旦我被更新务必更新我的开头注释以及所属文件夹的 md
from __future__ import annotations

from typing import Any

from pydantic import BaseModel


class ErrorResponse(BaseModel):
    code: str
    message: str
    details: Any | None = None
