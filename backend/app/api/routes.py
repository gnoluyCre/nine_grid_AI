from __future__ import annotations

from fastapi import APIRouter

from ..schemas import BirthChartApiResponse, BirthChartRequest, RegionOption
from ..services import BirthChartService

router = APIRouter(prefix="/api/v1", tags=["nine-grid"])
service = BirthChartService()


@router.get("/regions", response_model=list[RegionOption])
def list_regions() -> list[RegionOption]:
    return service.list_regions()


@router.post("/charts", response_model=BirthChartApiResponse)
def create_birth_chart(request: BirthChartRequest) -> BirthChartApiResponse:
    return service.build_birth_chart(request)
