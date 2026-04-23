// input: 后端接口字段、前端展示结构与档案列表/结果页共享数据约定。
// output: 前端全局共享类型定义与档案列表、结果页展示字段。
// pos: 前端类型系统中心。
// 一旦我被更新务必更新我的开头注释以及所属文件夹的 md
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

export interface RegionTreeDistrict {
  id: string;
  name: string;
  longitude: number;
}

export interface RegionTreeCity {
  name: string;
  districts: RegionTreeDistrict[];
}

export interface RegionTreeNode {
  name: string;
  cities: RegionTreeCity[];
}

export interface RegionSelectionValue {
  provinceName: string;
  cityName: string;
  districtName: string;
  regionId: string;
}

export interface PickerDraftState {
  year?: number;
  month?: number;
  day?: number;
  hour?: number;
  minute?: number;
}

export interface BirthFormValue {
  name: string;
  gender: string;
  birthDate: string;
  birthTime: string;
  regionId: string;
}

export interface CurrentUser {
  id: number;
  email: string;
  nickname: string;
  userCode: string;
  avatarKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterSendCodeRequest {
  nickname: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface RegisterConfirmRequest extends RegisterSendCodeRequest {
  verificationCode: string;
}

export interface PasswordResetSendCodeRequest {
  email: string;
}

export interface PasswordResetConfirmRequest {
  email: string;
  verificationCode: string;
  newPassword: string;
  confirmPassword: string;
}

export interface MessageResponse {
  message: string;
}

export type BatchExportStatus = "pending" | "running" | "completed" | "failed";

export interface BatchExportRequest {
  startDate: string;
  endDate: string;
}

export interface BatchExportJobResponse {
  jobId: string;
  status: BatchExportStatus;
  downloadReady: boolean;
  message?: string | null;
  fileName?: string | null;
  totalDays: number;
  processedDays: number;
  progressPercent: number;
  currentDate?: string | null;
}

export interface UpdateProfileRequest {
  nickname: string;
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

export interface ChartRecordListItem {
  id: number;
  name?: string;
  gender: string;
  birthDate: string;
  birthTime: string;
  regionId: string;
  regionText: string;
  ziHourType: "前子时" | "后子时" | "非子时";
  caseCount: number;
  hasLunarLeapCase: boolean;
  trueSolarDatetimeText: string;
  trueSolarShichen: string;
  createdAt: string;
  firstCaseSolarBirthday: string;
  firstCaseLunarBirthday: string;
  firstCaseYangDigitString: string;
  firstCaseYangMissingDigits: string;
  firstCaseYinDigitString: string;
  firstCaseYinMissingDigits: string;
}

export interface ChartRecordListResponse {
  items: ChartRecordListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ChartRecordSearchParams {
  name?: string;
  digitString?: string;
}

export interface ChartRecordDetailResponse {
  id: number;
  name?: string;
  gender: string;
  birthDate: string;
  birthTime: string;
  inputDatetimeText: string;
  regionId: string;
  regionText: string;
  longitude: number;
  ziHourType: "前子时" | "后子时" | "非子时";
  caseCount: number;
  hasLunarLeapCase: boolean;
  trueSolarDatetimeText: string;
  trueSolarShichen: string;
  createdAt: string;
  updatedAt: string;
  banners: BannerViewModel[];
  cases: ApiCaseViewModel[];
}

export interface EditingRecordContext {
  recordId: number;
  formValue: BirthFormValue;
}

export interface CaseSelectorItem {
  index: number;
  label: string;
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
