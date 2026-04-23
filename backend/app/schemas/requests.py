# input: 前端提交的排盘、登录、注册、密码重置数据。
# output: 后端请求体校验模型。
# pos: API 输入模型定义层。
# 一旦我被更新务必更新我的开头注释以及所属文件夹的 md
from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class BirthChartRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str | None = None
    gender: str = ""
    birthDate: str = Field(min_length=1)
    birthTime: str = ""
    regionId: str = ""


class RegisterSendCodeRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    nickname: str = Field(min_length=1, max_length=32)
    email: str = Field(min_length=5, max_length=254)
    password: str = Field(min_length=6, max_length=128)
    confirmPassword: str = Field(min_length=6, max_length=128)


class RegisterConfirmRequest(RegisterSendCodeRequest):
    verificationCode: str = Field(min_length=6, max_length=6)


class LoginRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    email: str = Field(min_length=5, max_length=254)
    password: str = Field(min_length=6, max_length=128)


class PasswordResetSendCodeRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    email: str = Field(min_length=5, max_length=254)


class PasswordResetConfirmRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    email: str = Field(min_length=5, max_length=254)
    verificationCode: str = Field(min_length=6, max_length=6)
    newPassword: str = Field(min_length=6, max_length=128)
    confirmPassword: str = Field(min_length=6, max_length=128)


class UpdateProfileRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    nickname: str = Field(min_length=1, max_length=32)
