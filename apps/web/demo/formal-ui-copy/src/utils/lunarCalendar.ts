const lunarInfo = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
  0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
  0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
  0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0,
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
  0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6,
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
  0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x055c0, 0x0ab60, 0x096d5, 0x092e0,
  0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
  0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,
  0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45,
  0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0,
  0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0,
  0x0a2e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4,
  0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0,
  0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160,
  0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a2d0, 0x0d150, 0x0f252,
  0x0d520,
];

const lunarMonthNames = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
const lunarDayNames = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'];

const solarTerms = [
  '小寒', '大寒', '立春', '雨水', '惊蛰', '春分',
  '清明', '谷雨', '立夏', '小满', '芒种', '夏至',
  '小暑', '大暑', '立秋', '处暑', '白露', '秋分',
  '寒露', '霜降', '立冬', '小雪', '大雪', '冬至',
];

const solarTermInfo = [
  0, 21208, 42467, 63836, 85337, 107014,
  128867, 150921, 173149, 195551, 218072, 240693,
  263343, 285989, 308563, 331033, 353350, 375494,
  397447, 419210, 440795, 462224, 483532, 504758,
];

function getLunarYearDays(year: number): number {
  let sum = 348;
  for (let i = 0x8000; i > 0x8; i >>= 1) {
    sum += (lunarInfo[year - 1900] & i) ? 1 : 0;
  }
  return sum + getLeapDays(year);
}

function getLeapMonth(year: number): number {
  return lunarInfo[year - 1900] & 0xf;
}

function getLeapDays(year: number): number {
  if (getLeapMonth(year)) {
    return (lunarInfo[year - 1900] & 0x10000) ? 30 : 29;
  }
  return 0;
}

function getLunarMonthDays(year: number, month: number): number {
  return (lunarInfo[year - 1900] & (0x10000 >> month)) ? 30 : 29;
}

function solarToLunar(year: number, month: number, day: number): { year: number; month: number; day: number; isLeap: boolean } | null {
  const baseDate = new Date(1900, 0, 31);
  const targetDate = new Date(year, month - 1, day);
  let offset = Math.floor((targetDate.getTime() - baseDate.getTime()) / 86400000);

  if (offset < 0) return null;

  let lunarYear = 1900;
  let yearDays: number;
  while (lunarYear < 2100 && offset > 0) {
    yearDays = getLunarYearDays(lunarYear);
    if (offset < yearDays) break;
    offset -= yearDays;
    lunarYear++;
  }

  if (lunarYear >= 2100) return null;

  const leapMonth = getLeapMonth(lunarYear);
  let isLeap = false;
  let lunarMonth = 1;
  let monthDays: number;

  for (let i = 1; i <= 12; i++) {
    if (leapMonth > 0 && i === leapMonth + 1 && !isLeap) {
      --i;
      isLeap = true;
      monthDays = getLeapDays(lunarYear);
    } else {
      monthDays = getLunarMonthDays(lunarYear, i);
    }

    if (offset < monthDays) {
      lunarMonth = i;
      break;
    }
    offset -= monthDays;

    if (isLeap && i === leapMonth + 1) {
      isLeap = false;
    }
  }

  return {
    year: lunarYear,
    month: lunarMonth,
    day: offset + 1,
    isLeap,
  };
}

function getSolarTerm(year: number, month: number, day: number): string | null {
  const baseDate = new Date(1900, 0, 6, 2, 5, 0);
  
  for (let i = (month - 1) * 2; i < month * 2; i++) {
    const termDate = new Date(baseDate.getTime() + solarTermInfo[i] * 60000);
    const termYear = termDate.getFullYear();
    const termMonth = termDate.getMonth() + 1;
    const termDay = termDate.getDate();
    
    if (termYear === year && termMonth === month && termDay === day) {
      return solarTerms[i];
    }
  }
  
  for (let i = 0; i < 24; i++) {
    const termDate = new Date(baseDate.getTime() + solarTermInfo[i] * 60000);
    const termYear = termDate.getFullYear();
    const termMonth = termDate.getMonth() + 1;
    const termDay = termDate.getDate();
    
    if (termYear === year && termMonth === month && termDay === day) {
      return solarTerms[i];
    }
    
    if (termYear === year && termMonth === month && termDay > day) {
      return null;
    }
  }
  
  return null;
}

function getNextSolarTerm(year: number, month: number, day: number): { name: string; daysUntil: number } | null {
  const currentDate = new Date(year, month - 1, day);
  const baseDate = new Date(1900, 0, 6, 2, 5, 0);
  
  for (let i = 0; i < 24; i++) {
    const termDate = new Date(baseDate.getTime() + solarTermInfo[i] * 60000);
    const termYear = termDate.getFullYear();
    const termMonth = termDate.getMonth() + 1;
    const termDay = termDate.getDate();
    
    if (termYear > year || (termYear === year && termMonth > month) || 
        (termYear === year && termMonth === month && termDay > day)) {
      const daysUntil = Math.ceil((termDate.getTime() - currentDate.getTime()) / 86400000);
      return { name: solarTerms[i], daysUntil };
    }
  }
  
  const nextYearFirstTerm = new Date(baseDate.getTime() + solarTermInfo[0] * 60000);
  nextYearFirstTerm.setFullYear(year + 1);
  const daysUntil = Math.ceil((nextYearFirstTerm.getTime() - currentDate.getTime()) / 86400000);
  return { name: solarTerms[0], daysUntil };
}

export function getFormattedDate(date?: Date): {
  dateStr: string;
  weekDay: string;
  lunarStr: string;
  solarTerm: string | null;
  nextSolarTerm: { name: string; daysUntil: number } | null;
} {
  const d = date || new Date();
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  
  const dateStr = `${year}年${month}月${day}日`;
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const weekDay = `星期${weekDays[d.getDay()]}`;
  
  const lunar = solarToLunar(year, month, day);
  const lunarStr = lunar 
    ? `${lunarMonthNames[lunar.month - 1]}月${lunarDayNames[lunar.day - 1]}`
    : '';
  
  const currentSolarTerm = getSolarTerm(year, month, day);
  const nextTerm = getNextSolarTerm(year, month, day);
  
  return {
    dateStr,
    weekDay,
    lunarStr,
    solarTerm: currentSolarTerm,
    nextSolarTerm: nextTerm,
  };
}

export function formatSubtitleWithLunar(date?: Date): string {
  const { dateStr, weekDay, lunarStr, solarTerm } = getFormattedDate(date);
  
  let subtitle = `${dateStr} · ${weekDay}`;
  if (lunarStr) {
    subtitle += ` · ${lunarStr}`;
  }
  if (solarTerm) {
    subtitle += ` · ${solarTerm}`;
  }
  
  return subtitle;
}
