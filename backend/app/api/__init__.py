# input: api.routes 中定义的 FastAPI 路由对象。
# output: router 路由入口导出。
# pos: backend API 层的包出口。
# 一旦我被更新务必更新我的开头注释以及所属文件夹的 md
from .routes import router

__all__ = ["router"]
