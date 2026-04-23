// input: 后端排盘响应、档案响应与前端展示类型。
// output: 结果页所需的视图模型转换函数。
// pos: 前端结果展示映射层。
// 一旦我被更新务必更新我的开头注释以及所属文件夹的 md
import type {
  BannerViewModel,
  BirthChartApiResponse,
  BirthFormValue,
  CaseSelectorViewModel,
  ChartRecordDetailResponse,
  ChartMode,
  ChartCaseViewModel,
  GridBoardViewModel,
  GridCellViewModel,
  ResultPageViewModel,
} from "../types/models";
import { CASE_FIXTURES, DEFAULT_FIXTURE_ID, REGION_OPTIONS, type CaseFixture } from "../fixtures/sampleCases";

const CELL_LAYOUT = [1, 4, 7, 2, 5, 8, 3, 6, 9, null, 0, null] as const;

const FIXTURE_MAP = new Map(CASE_FIXTURES.map((fixture) => [fixture.id, fixture]));

function buildFrequencyMap(source: string) {
  const map = new Map<string, number>();

  for (const digit of source) {
    map.set(digit, (map.get(digit) ?? 0) + 1);
  }

  return map;
}

function buildSubSoulFrequencyByDigit(subSoul: string) {
  return buildFrequencyMap(subSoul);
}

function buildPoFrequencyByDigit(poRaw: string) {
  return buildFrequencyMap(poRaw);
}

function buildMainSoulFrequencyByDigit(mainSoul: string) {
  const map = new Map<string, number>();

  for (const digit of mainSoul) {
    if (!map.has(digit)) {
      map.set(digit, 1);
    }
  }

  return map;
}

function buildBoard(chart: Omit<GridBoardViewModel, "cells">): GridBoardViewModel {
  const mainSoulFrequency = buildMainSoulFrequencyByDigit(chart.mainSoul);
  const subSoulFrequency = buildSubSoulFrequencyByDigit(chart.subSoul);
  const poFrequency = buildPoFrequencyByDigit(chart.poRaw);

  const cells: GridCellViewModel[] = CELL_LAYOUT.map((cellNumber, index) => {
    if (cellNumber === null) {
      return {
        id: `placeholder-${index}`,
        cellNumber: null,
        centerDigit: "",
        isPlaceholder: true,
        count: 0,
        isMainSoul: false,
        isSubSoul: false,
        isPo: false,
        isMissing: false,
        mainSoulCount: 0,
        subSoulCount: 0,
        poCount: 0,
        hasMissing: false,
        markers: [],
      };
    }

    const digit = String(cellNumber);
    const count = [...chart.digitString].filter((item) => item === digit).length;
    const mainSoulCount = mainSoulFrequency.get(digit) ?? 0;
    const subSoulCount = subSoulFrequency.get(digit) ?? 0;
    const poCount = poFrequency.get(digit) ?? 0;
    const hasMissing = chart.missingDigits.includes(digit);

    return {
      id: `cell-${cellNumber}`,
      cellNumber,
      centerDigit: digit,
      isPlaceholder: false,
      count,
      isMainSoul: chart.mainSoul.includes(digit),
      isSubSoul: chart.subSoul.includes(digit),
      isPo: chart.po.includes(digit),
      isMissing: hasMissing,
      mainSoulCount,
      subSoulCount,
      poCount,
      hasMissing,
      markers: [],
    };
  });

  return {
    ...chart,
    cells,
  };
}

function buildBanners(fixture: CaseFixture, activeCaseIndex: number): BannerViewModel[] {
  const banners: BannerViewModel[] = [];
  const activeCase = fixture.cases[activeCaseIndex];

  if (fixture.summary.ziHourType !== "非子时") {
    banners.push({
      type: "warning",
      code: "zi-hour",
      title: `${fixture.summary.ziHourType}双方案提示`,
      description: "当前结果存在两套有效方案，请结合方案切换一起查看，不要只读取第一套。",
    });
  }

  if (activeCase.metrics.lunarIsLeapMonth) {
    banners.push({
      type: "info",
      code: "lunar-leap",
      title: "农历闰月提示",
      description: "当前方案对应农历闰月，阴格展示串已在前方补 1，但不影响缺数与缺门统计。",
    });
  }

  return banners;
}

export function buildResultViewModelFromFixture(
  fixtureId: string,
  formValue?: BirthFormValue,
  activeCaseIndex = 0,
  mode: ChartMode = "yang",
): ResultPageViewModel {
  const fixture = FIXTURE_MAP.get(fixtureId) ?? FIXTURE_MAP.get(DEFAULT_FIXTURE_ID)!;
  const resolvedFormValue = formValue ?? fixture.formPreset;
  const region = REGION_OPTIONS.find((item) => item.id === resolvedFormValue.regionId) ?? REGION_OPTIONS[0];
  const safeCaseIndex = Math.min(activeCaseIndex, fixture.cases.length - 1);
  const activeFixtureCase = fixture.cases[safeCaseIndex];
  const banners = buildBanners(fixture, safeCaseIndex);

  const activeCase: ChartCaseViewModel = {
    index: safeCaseIndex,
    label: activeFixtureCase.label,
    mode,
    metrics: activeFixtureCase.metrics,
    tabs: [
      {
        key: "yang",
        label: "阳格",
        grid: buildBoard(activeFixtureCase.charts.yang),
      },
      {
        key: "yin",
        label: "阴格",
        grid: buildBoard(activeFixtureCase.charts.yin),
      },
    ],
  };

  const caseSelector: CaseSelectorViewModel = {
    caseCount: fixture.cases.length,
    activeCaseIndex: safeCaseIndex,
    items: fixture.cases.map((item, index) => ({
      index,
      label: item.label,
      solarBirthday: item.metrics.solarBirthday,
    })),
  };

  return {
    summary: {
      name: resolvedFormValue.name,
      gender: resolvedFormValue.gender,
      inputBirthDate: resolvedFormValue.birthDate,
      inputBirthTime: resolvedFormValue.birthTime,
      regionText: `${region.provinceName} ${region.cityName} ${region.districtName}`,
      trueSolarDatetimeText: fixture.summary.trueSolarDatetimeText,
      trueSolarShichen: fixture.summary.trueSolarShichen,
      ziHourType: fixture.summary.ziHourType,
    },
    banners,
    caseSelector,
    activeCase,
  };
}

export function buildApiResponseFromFixture(
  fixtureId: string,
  formValue?: BirthFormValue,
): BirthChartApiResponse {
  const viewModel = buildResultViewModelFromFixture(fixtureId, formValue);

  return {
    summary: viewModel.summary,
    banners: viewModel.banners,
    cases: viewModel.caseSelector.items.map((item) => {
      const caseViewModel = buildResultViewModelFromFixture(fixtureId, formValue, item.index);
      const tabs = caseViewModel.activeCase.tabs;

      return {
        index: item.index,
        label: item.label,
        metrics: caseViewModel.activeCase.metrics,
        charts: {
          yang: tabs.find((tab) => tab.key === "yang")!.grid,
          yin: tabs.find((tab) => tab.key === "yin")!.grid,
        },
      };
    }),
  };
}

export function buildResultViewModelFromApiResponse(
  payload: BirthChartApiResponse,
  activeCaseIndex = 0,
  mode: ChartMode = "yang",
): ResultPageViewModel {
  const safeCaseIndex = Math.min(activeCaseIndex, payload.cases.length - 1);
  const activeApiCase = payload.cases[safeCaseIndex];

  const activeCase: ChartCaseViewModel = {
    index: safeCaseIndex,
    label: activeApiCase.label,
    mode,
    metrics: activeApiCase.metrics,
    tabs: [
      {
        key: "yang",
        label: "阳格",
        grid: activeApiCase.charts.yang,
      },
      {
        key: "yin",
        label: "阴格",
        grid: activeApiCase.charts.yin,
      },
    ],
  };

  const caseSelector: CaseSelectorViewModel = {
    caseCount: payload.cases.length,
    activeCaseIndex: safeCaseIndex,
    items: payload.cases.map((item) => ({
      index: item.index,
      label: item.label,
      solarBirthday: item.metrics.solarBirthday,
    })),
  };

  return {
    summary: payload.summary,
    banners: payload.banners,
    caseSelector,
    activeCase,
  };
}

export function buildResultViewModelFromRecordDetail(
  payload: ChartRecordDetailResponse,
  activeCaseIndex = 0,
  mode: ChartMode = "yang",
): ResultPageViewModel {
  return buildResultViewModelFromApiResponse(
    {
      summary: {
        name: payload.name,
        gender: payload.gender,
        inputBirthDate: payload.birthDate,
        inputBirthTime: payload.birthTime,
        regionText: payload.regionText,
        trueSolarDatetimeText: payload.trueSolarDatetimeText,
        trueSolarShichen: payload.trueSolarShichen,
        ziHourType: payload.ziHourType,
      },
      banners: payload.banners,
      cases: payload.cases,
    },
    activeCaseIndex,
    mode,
  );
}

export function resolveFixtureId(formValue: BirthFormValue) {
  const match = CASE_FIXTURES.find(
    (fixture) =>
      fixture.formPreset.birthDate === formValue.birthDate &&
      fixture.formPreset.birthTime === formValue.birthTime &&
      fixture.formPreset.regionId === formValue.regionId,
  );

  return match?.id ?? DEFAULT_FIXTURE_ID;
}
