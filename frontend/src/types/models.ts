export type ChartMode = "yang" | "yin";
export type BannerType = "info" | "warning";
export type BannerCode = "zi-hour" | "lunar-leap";
export type CellMarkerType = "count" | "mainSoul" | "subSoul" | "po" | "missing";
export type CellMarkerPosition =
  | "top-left"
  | "right-middle"
  | "bottom-left"
  | "top-right"
  | "bottom";

export interface RegionOption {
  id: string;
  provinceName: string;
  cityName: string;
  districtName: string;
  longitude: number;
}

export interface BirthFormValue {
  name: string;
  gender: string;
  birthDate: string;
  birthTime: string;
  regionId: string;
}

export interface ResultSummaryViewModel {
  name?: string;
  gender: string;
  inputBirthDate: string;
  inputBirthTime: string;
  regionText: string;
  trueSolarDatetimeText: string;
  trueSolarShichen: string;
  ziHourType: "前子时" | "后子时" | "非子时";
}

export interface BannerViewModel {
  type: BannerType;
  code: BannerCode;
  title: string;
  description: string;
}

export interface CellMarkerViewModel {
  type: CellMarkerType;
  position: CellMarkerPosition;
  value?: string;
}

export interface GridCellViewModel {
  id: string;
  cellNumber: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | null;
  centerDigit: string;
  isPlaceholder: boolean;
  count: number;
  isMainSoul: boolean;
  isSubSoul: boolean;
  isPo: boolean;
  isMissing: boolean;
  mainSoulCount: number;
  subSoulCount: number;
  poCount: number;
  hasMissing: boolean;
  markers: CellMarkerViewModel[];
}

export interface GridBoardViewModel {
  chartType: ChartMode;
  digitString: string;
  missingDigits: string;
  missingAttributes: string;
  missingCount: number;
  po: string;
  poRaw: string;
  mainSoul: string;
  subSoul: string;
  halfSupplement: string;
  cells: GridCellViewModel[];
}

export interface CaseMetricsViewModel {
  solarBirthday: string;
  lunarBirthday: string;
  lunarBirthdayDisplay: string;
  age: number;
  trueSolarShichen: string;
  lunarIsLeapMonth: boolean;
}

export interface ApiCaseViewModel {
  index: number;
  label: string;
  dateRelation: string;
  metrics: CaseMetricsViewModel;
  charts: {
    yang: GridBoardViewModel;
    yin: GridBoardViewModel;
  };
}

export interface BirthChartApiResponse {
  summary: ResultSummaryViewModel;
  banners: BannerViewModel[];
  cases: ApiCaseViewModel[];
}

export interface CaseSelectorItem {
  index: number;
  label: string;
  dateRelation: string;
  solarBirthday: string;
}

export interface CaseSelectorViewModel {
  caseCount: number;
  activeCaseIndex: number;
  items: CaseSelectorItem[];
}

export interface ChartTabViewModel {
  key: ChartMode;
  label: string;
  grid: GridBoardViewModel;
}

export interface ChartCaseViewModel {
  index: number;
  label: string;
  dateRelation: string;
  mode: ChartMode;
  tabs: ChartTabViewModel[];
  metrics: CaseMetricsViewModel;
}

export interface ResultPageViewModel {
  summary: ResultSummaryViewModel;
  banners: BannerViewModel[];
  caseSelector: CaseSelectorViewModel;
  activeCase: ChartCaseViewModel;
}
