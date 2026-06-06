import {
  format,
  addDays,
  addWeeks,
  addMonths,
  addYears,
  startOfWeek,
  startOfMonth,
  startOfYear,
  endOfWeek,
  endOfMonth,
  endOfYear,
  differenceInDays,
  differenceInCalendarDays,
  isSameDay,
  isBefore,
  isAfter,
  parseISO,
  getDay,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';

export const VIEW_MODES = {
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
  YEAR: 'year',
};

export const DAY_WIDTH = 40;
export const WEEK_WIDTH = 120;
export const MONTH_WIDTH = 300;
export const YEAR_WIDTH = 800;
export const ROW_HEIGHT = 40;
export const TASK_HEIGHT = 28;
export const TASK_GAP = 6;
export const LEFT_PANEL_WIDTH = 220;
export const HEADER_HEIGHT = 60;

export function getDateFormatter(viewMode) {
  switch (viewMode) {
    case VIEW_MODES.DAY:
      return (date) => format(date, 'MM/dd', { locale: zhCN });
    case VIEW_MODES.WEEK:
      return (date) => `第${format(date, 'I')}周`;
    case VIEW_MODES.MONTH:
      return (date) => format(date, 'yyyy年MM月', { locale: zhCN });
    case VIEW_MODES.YEAR:
      return (date) => format(date, 'yyyy年', { locale: zhCN });
    default:
      return (date) => format(date, 'MM/dd');
  }
}

export function getCellWidth(viewMode) {
  switch (viewMode) {
    case VIEW_MODES.DAY:
      return DAY_WIDTH;
    case VIEW_MODES.WEEK:
      return WEEK_WIDTH;
    case VIEW_MODES.MONTH:
      return MONTH_WIDTH;
    case VIEW_MODES.YEAR:
      return YEAR_WIDTH;
    default:
      return DAY_WIDTH;
  }
}

export function generateTimeRange(startDate, endDate, viewMode) {
  const cells = [];
  let current = startOfPeriod(startDate, viewMode);
  const end = endOfPeriod(endDate, viewMode);

  while (isBefore(current, end) || isSameDay(current, end)) {
    cells.push({
      date: new Date(current),
      label: getDateFormatter(viewMode)(current),
    });
    current = nextPeriod(current, viewMode);
  }

  return cells;
}

export function startOfPeriod(date, viewMode) {
  switch (viewMode) {
    case VIEW_MODES.DAY:
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    case VIEW_MODES.WEEK:
      return startOfWeek(date, { weekStartsOn: 1 });
    case VIEW_MODES.MONTH:
      return startOfMonth(date);
    case VIEW_MODES.YEAR:
      return startOfYear(date);
    default:
      return new Date(date);
  }
}

export function endOfPeriod(date, viewMode) {
  switch (viewMode) {
    case VIEW_MODES.DAY:
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    case VIEW_MODES.WEEK:
      return endOfWeek(date, { weekStartsOn: 1 });
    case VIEW_MODES.MONTH:
      return endOfMonth(date);
    case VIEW_MODES.YEAR:
      return endOfYear(date);
    default:
      return new Date(date);
  }
}

export function nextPeriod(date, viewMode) {
  switch (viewMode) {
    case VIEW_MODES.DAY:
      return addDays(date, 1);
    case VIEW_MODES.WEEK:
      return addWeeks(date, 1);
    case VIEW_MODES.MONTH:
      return addMonths(date, 1);
    case VIEW_MODES.YEAR:
      return addYears(date, 1);
    default:
      return addDays(date, 1);
  }
}

export function getTaskPosition(startDate, endDate, viewStart, viewMode) {
  const cellWidth = getCellWidth(viewMode);
  const daysFromStart = differenceInCalendarDays(startDate, viewStart);
  const duration = calculateDuration(startDate, endDate);

  if (viewMode === VIEW_MODES.DAY) {
    return {
      left: daysFromStart * cellWidth,
      width: Math.max(duration * cellWidth, cellWidth * 0.5),
    };
  }

  const left = daysFromStart * (cellWidth / getDaysInPeriod(viewMode, viewStart));
  const width = duration * (cellWidth / getDaysInPeriod(viewMode, viewStart));

  return {
    left,
    width: Math.max(width, cellWidth * 0.3),
  };
}

export function getDaysInPeriod(viewMode, date) {
  switch (viewMode) {
    case VIEW_MODES.DAY:
      return 1;
    case VIEW_MODES.WEEK:
      return 7;
    case VIEW_MODES.MONTH:
      const end = endOfMonth(date);
      const start = startOfMonth(date);
      return differenceInDays(end, start) + 1;
    case VIEW_MODES.YEAR:
      return 365;
    default:
      return 1;
  }
}

export function calculateDuration(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  return differenceInCalendarDays(endDate, startDate) + 1;
}

export function dateFromPixelOffset(pixelX, viewStart, viewMode) {
  const cellWidth = getCellWidth(viewMode);
  const daysPerCell = viewMode === VIEW_MODES.DAY ? 1 : (viewMode === VIEW_MODES.WEEK ? 7 : 30);
  const days = pixelX / (cellWidth / daysPerCell);
  const result = addDays(viewStart, Math.round(days));
  return new Date(result.getFullYear(), result.getMonth(), result.getDate());
}

export function snapToDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function isToday(date) {
  return isSameDay(date, new Date());
}

export function getTodayPosition(viewStart, viewMode) {
  const today = new Date();
  const { left } = getTaskPosition(today, today, viewStart, viewMode);
  return left;
}

export function formatDate(date) {
  if (!date) return '';
  return format(date, 'yyyy-MM-dd');
}

export function parseDate(dateStr) {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;
  return parseISO(dateStr);
}

export function getWeekday(date) {
  return getDay(date);
}
