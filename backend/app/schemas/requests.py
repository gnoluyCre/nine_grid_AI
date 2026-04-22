from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class BirthChartRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str | None = None
    gender: str = Field(min_length=1)
    birthDate: str = Field(min_length=1)
    birthTime: str = Field(min_length=1)
    regionId: str = Field(min_length=1)
