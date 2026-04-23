// input: BirthFormValue、GridBoardViewModel 与地区类型。
// output: 前端演示和回归用的样例数据。
// pos: 前端本地 fixture 数据源。
// 一旦我被更新务必更新我的开头注释以及所属文件夹的 md
import type { BirthFormValue, GridBoardViewModel, RegionOption } from "../types/models";

type FixtureChart = Omit<GridBoardViewModel, "cells">;

export interface CaseFixture {
  id: string;
  title: string;
  description: string;
  summary: {
    trueSolarDatetimeText: string;
    trueSolarShichen: "子" | "丑" | "寅" | "卯" | "辰" | "巳" | "午" | "未" | "申" | "酉" | "戌" | "亥";
    ziHourType: "前子时" | "后子时" | "非子时";
  };
  cases: Array<{
    label: string;
    dateRelation: string;
    metrics: {
      solarBirthday: string;
      lunarBirthday: string;
      lunarBirthdayDisplay: string;
      age: number;
      trueSolarShichen: string;
      lunarIsLeapMonth: boolean;
    };
    charts: {
      yang: FixtureChart;
      yin: FixtureChart;
    };
  }>;
  formPreset: BirthFormValue;
}

export interface QuickCaseOption {
  id: string;
  label: string;
}

export const REGION_OPTIONS: RegionOption[] = [
  {
    id: "新疆维吾尔自治区|乌鲁木齐市|头屯河区",
    provinceName: "新疆维吾尔自治区",
    cityName: "乌鲁木齐市",
    districtName: "头屯河区",
    longitude: 87.42,
  },
  {
    id: "浙江省|杭州市|西湖区",
    provinceName: "浙江省",
    cityName: "杭州市",
    districtName: "西湖区",
    longitude: 120.126897,
  },
  {
    id: "北京市|北京城区|朝阳区",
    provinceName: "北京市",
    cityName: "北京城区",
    districtName: "朝阳区",
    longitude: 116.443205,
  },
];

export const CASE_FIXTURES: CaseFixture[] = [
  {
    id: "standard",
    title: "普通日期案例",
    description: "来自真实验收测试的标准单方案，适合看完整阳格/阴格展示。",
    summary: {
      trueSolarDatetimeText: "1999-10-11 04:03:10",
      trueSolarShichen: "寅",
      ziHourType: "非子时",
    },
    cases: [
      {
        label: "第一套",
        dateRelation: "当前日期",
        metrics: {
          solarBirthday: "1999-10-11",
          lunarBirthday: "1999-09-03",
          lunarBirthdayDisplay: "1999年9月3日",
          age: 26,
          trueSolarShichen: "寅",
          lunarIsLeapMonth: false,
        },
        charts: {
          yang: {
            chartType: "yang",
            digitString: "19314",
            missingDigits: "25678",
            missingAttributes: "金、木、水、土",
            missingCount: 4,
            po: "019",
            poRaw: "01111999",
            mainSoul: "4",
            subSoul: "1931",
            halfSupplement: "45",
          },
          yin: {
            chartType: "yin",
            digitString: "9404",
            missingDigits: "25678",
            missingAttributes: "金、木、水、土",
            missingCount: 4,
            po: "0139",
            poRaw: "00139999",
            mainSoul: "4",
            subSoul: "940",
            halfSupplement: "45",
          },
        },
      },
    ],
    formPreset: {
      name: "林知微",
      gender: "男",
      birthDate: "1999-10-11",
      birthTime: "06:00",
      regionId: "新疆维吾尔自治区|乌鲁木齐市|头屯河区",
    },
  },
  {
    id: "after-2000",
    title: "2000年后案例",
    description: "来自真实验收测试的 2000 年后单方案案例，适合验证较新出生日期的展示。",
    summary: {
      trueSolarDatetimeText: "2024-03-10 13:55:03",
      trueSolarShichen: "未",
      ziHourType: "非子时",
    },
    cases: [
      {
        label: "第一套",
        dateRelation: "当前日期",
        metrics: {
          solarBirthday: "2024-03-10",
          lunarBirthday: "2024-02-01",
          lunarBirthdayDisplay: "2024年2月1日",
          age: 2,
          trueSolarShichen: "未",
          lunarIsLeapMonth: false,
        },
        charts: {
          yang: {
            chartType: "yang",
            digitString: "0123",
            missingDigits: "56789",
            missingAttributes: "木、水、土",
            missingCount: 3,
            po: "01234",
            poRaw: "00012234",
            mainSoul: "3",
            subSoul: "012",
            halfSupplement: "789",
          },
          yin: {
            chartType: "yin",
            digitString: "02112",
            missingDigits: "356789",
            missingAttributes: "木、水、火、土",
            missingCount: 4,
            po: "012",
            poRaw: "00001222",
            mainSoul: "2",
            subSoul: "0211",
            halfSupplement: "789",
          },
        },
      },
    ],
    formPreset: {
      name: "案例用户B",
      gender: "女",
      birthDate: "2024-03-10",
      birthTime: "14:20",
      regionId: "北京市|北京城区|朝阳区",
    },
  },
  {
    id: "lunar-leap",
    title: "农历闰月案例",
    description: "来自真实验收测试，用于验证闰月补 1 会参与阴格正式计算，而不只是展示前缀。",
    summary: {
      trueSolarDatetimeText: "2020-05-23 12:04:02",
      trueSolarShichen: "午",
      ziHourType: "非子时",
    },
    cases: [
      {
        label: "第一套",
        dateRelation: "当前日期",
        metrics: {
          solarBirthday: "2020-05-23",
          lunarBirthday: "2020-04-01",
          lunarBirthdayDisplay: "2020年闰4月1日",
          age: 5,
          trueSolarShichen: "午",
          lunarIsLeapMonth: true,
        },
        charts: {
          yang: {
            chartType: "yang",
            digitString: "02145",
            missingDigits: "6789",
            missingAttributes: "水、土",
            missingCount: 2,
            po: "0235",
            poRaw: "00022235",
            mainSoul: "5",
            subSoul: "0214",
            halfSupplement: "3",
          },
          yin: {
            chartType: "yin",
            digitString: "104419",
            missingDigits: "35678",
            missingAttributes: "木、水、火、土",
            missingCount: 4,
            po: "0124",
            poRaw: "00001224",
            mainSoul: "9",
            subSoul: "10441",
            halfSupplement: "3",
          },
        },
      },
    ],
    formPreset: {
      name: "沈知夏",
      gender: "男",
      birthDate: "2020-05-23",
      birthTime: "12:00",
      regionId: "浙江省|杭州市|西湖区",
    },
  },
  {
    id: "front-zi",
    title: "前子时案例",
    description: "来自真实验收测试，验证前子时双方案切换：当天 + 后一天。",
    summary: {
      trueSolarDatetimeText: "2013-06-05 23:37:26",
      trueSolarShichen: "子",
      ziHourType: "前子时",
    },
    cases: [
      {
        label: "第一套",
        dateRelation: "当天",
        metrics: {
          solarBirthday: "2013-06-05",
          lunarBirthday: "2013-04-27",
          lunarBirthdayDisplay: "2013年4月27日",
          age: 12,
          trueSolarShichen: "子",
          lunarIsLeapMonth: false,
        },
        charts: {
          yang: {
            chartType: "yang",
            digitString: "0178",
            missingDigits: "49",
            missingAttributes: "木、土",
            missingCount: 2,
            po: "012356",
            poRaw: "00012356",
            mainSoul: "8",
            subSoul: "017",
            halfSupplement: "06",
          },
          yin: {
            chartType: "yin",
            digitString: "19101",
            missingDigits: "568",
            missingAttributes: "木、水、土",
            missingCount: 3,
            po: "012347",
            poRaw: "00122347",
            mainSoul: "1",
            subSoul: "1910",
            halfSupplement: "06",
          },
        },
      },
      {
        label: "第二套",
        dateRelation: "后一天",
        metrics: {
          solarBirthday: "2013-06-06",
          lunarBirthday: "2013-04-28",
          lunarBirthdayDisplay: "2013年4月28日",
          age: 12,
          trueSolarShichen: "子",
          lunarIsLeapMonth: false,
        },
        charts: {
          yang: {
            chartType: "yang",
            digitString: "0189",
            missingDigits: "457",
            missingAttributes: "木、土",
            missingCount: 2,
            po: "01236",
            poRaw: "00012366",
            mainSoul: "9",
            subSoul: "018",
            halfSupplement: "06",
          },
          yin: {
            chartType: "yin",
            digitString: "202",
            missingDigits: "5679",
            missingAttributes: "木、水、土",
            missingCount: 3,
            po: "012348",
            poRaw: "00122348",
            mainSoul: "2",
            subSoul: "20",
            halfSupplement: "06",
          },
        },
      },
    ],
    formPreset: {
      name: "许昭",
      gender: "女",
      birthDate: "2013-06-05",
      birthTime: "23:35",
      regionId: "浙江省|杭州市|西湖区",
    },
  },
  {
    id: "back-zi",
    title: "后子时案例",
    description: "来自真实验收测试，验证后子时双方案切换：当天 + 前一天。",
    summary: {
      trueSolarDatetimeText: "2014-07-08 00:11:45",
      trueSolarShichen: "子",
      ziHourType: "后子时",
    },
    cases: [
      {
        label: "第一套",
        dateRelation: "当天",
        metrics: {
          solarBirthday: "2014-07-08",
          lunarBirthday: "2014-06-12",
          lunarBirthdayDisplay: "2014年6月12日",
          age: 11,
          trueSolarShichen: "子",
          lunarIsLeapMonth: false,
        },
        charts: {
          yang: {
            chartType: "yang",
            digitString: "0224",
            missingDigits: "3569",
            missingAttributes: "木、水、火、土",
            missingCount: 4,
            po: "012478",
            poRaw: "00012478",
            mainSoul: "4",
            subSoul: "022",
            halfSupplement: "06",
          },
          yin: {
            chartType: "yin",
            digitString: "167",
            missingDigits: "3589",
            missingAttributes: "木、火、土",
            missingCount: 3,
            po: "01246",
            poRaw: "00112246",
            mainSoul: "7",
            subSoul: "16",
            halfSupplement: "06",
          },
        },
      },
      {
        label: "第二套",
        dateRelation: "前一天",
        metrics: {
          solarBirthday: "2014-07-07",
          lunarBirthday: "2014-06-11",
          lunarBirthdayDisplay: "2014年6月11日",
          age: 11,
          trueSolarShichen: "子",
          lunarIsLeapMonth: false,
        },
        charts: {
          yang: {
            chartType: "yang",
            digitString: "0213",
            missingDigits: "5689",
            missingAttributes: "木、水、土",
            missingCount: 3,
            po: "01247",
            poRaw: "00012477",
            mainSoul: "3",
            subSoul: "021",
            halfSupplement: "06",
          },
          yin: {
            chartType: "yin",
            digitString: "1156",
            missingDigits: "3789",
            missingAttributes: "火、土",
            missingCount: 2,
            po: "01246",
            poRaw: "00111246",
            mainSoul: "6",
            subSoul: "115",
            halfSupplement: "06",
          },
        },
      },
    ],
    formPreset: {
      name: "周行",
      gender: "男",
      birthDate: "2014-07-08",
      birthTime: "00:16",
      regionId: "浙江省|杭州市|西湖区",
    },
  },
  {
    id: "suffix-main-soul",
    title: "主魂后置数字案例",
    description: "来自真实验收测试，验证主魂可以是多数字字符串。",
    summary: {
      trueSolarDatetimeText: "1910-08-19 11:41:44",
      trueSolarShichen: "午",
      ziHourType: "非子时",
    },
    cases: [
      {
        label: "第一套",
        dateRelation: "当前日期",
        metrics: {
          solarBirthday: "1910-08-19",
          lunarBirthday: "1910-07-15",
          lunarBirthdayDisplay: "1910年7月15日",
          age: 115,
          trueSolarShichen: "午",
          lunarIsLeapMonth: false,
        },
        charts: {
          yang: {
            chartType: "yang",
            digitString: "1291121",
            missingDigits: "34567",
            missingAttributes: "木、水、火、土",
            missingCount: 4,
            po: "0189",
            poRaw: "00111899",
            mainSoul: "21",
            subSoul: "12911",
            halfSupplement: "3",
          },
          yin: {
            chartType: "yin",
            digitString: "1246",
            missingDigits: "38",
            missingAttributes: "火、土",
            missingCount: 2,
            po: "01579",
            poRaw: "00111579",
            mainSoul: "6",
            subSoul: "124",
            halfSupplement: "3",
          },
        },
      },
    ],
    formPreset: {
      name: "秦瑾",
      gender: "男",
      birthDate: "1910-08-19",
      birthTime: "12:00",
      regionId: "北京市|北京城区|朝阳区",
    },
  },
];

export const DEFAULT_FIXTURE_ID = "standard";

export const QUICK_CASES: QuickCaseOption[] = [
  { id: "standard", label: "普通案例" },
  { id: "after-2000", label: "2000年后" },
  { id: "lunar-leap", label: "闰月案例" },
  { id: "front-zi", label: "前子时" },
  { id: "back-zi", label: "后子时" },
  { id: "suffix-main-soul", label: "主魂多值" },
];
