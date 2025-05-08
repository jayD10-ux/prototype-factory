
declare module 'date-fns' {
  export function formatDistance(date: Date | number, baseDate: Date | number, options?: {
    includeSeconds?: boolean;
    addSuffix?: boolean;
    locale?: Locale;
  }): string;

  export function formatDistanceToNow(date: Date | number, options?: {
    includeSeconds?: boolean;
    addSuffix?: boolean;
    locale?: Locale;
  }): string;

  export function format(date: Date | number, format: string, options?: {
    locale?: Locale;
    weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    firstWeekContainsDate?: number;
    useAdditionalWeekYearTokens?: boolean;
    useAdditionalDayOfYearTokens?: boolean;
  }): string;

  export function parseISO(dateString: string): Date;
  export function isToday(date: Date | number): boolean;
  export function isYesterday(date: Date | number): boolean;
  export function formatRelative(date: Date | number, baseDate: Date | number, options?: {
    locale?: Locale;
    weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  }): string;

  interface Locale {
    code?: string;
    formatDistance?: (...args: any[]) => any;
    formatRelative?: (...args: any[]) => any;
    localize?: {
      ordinalNumber: (...args: any[]) => any;
      era: (...args: any[]) => any;
      quarter: (...args: any[]) => any;
      month: (...args: any[]) => any;
      day: (...args: any[]) => any;
      dayPeriod: (...args: any[]) => any;
    };
    formatLong?: {
      date: (...args: any[]) => any;
      time: (...args: any[]) => any;
      dateTime: (...args: any[]) => any;
    };
    match?: {
      ordinalNumber: (...args: any[]) => any;
      era: (...args: any[]) => any;
      quarter: (...args: any[]) => any;
      month: (...args: any[]) => any;
      day: (...args: any[]) => any;
      dayPeriod: (...args: any[]) => any;
    };
    options?: {
      weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
      firstWeekContainsDate?: 1 | 2 | 3 | 4 | 5 | 6 | 7;
    };
  }

  // Add commonly used functions that might be causing issues
  export function addDays(date: Date | number, amount: number): Date;
  export function subDays(date: Date | number, amount: number): Date;
  export function addMonths(date: Date | number, amount: number): Date;
  export function subMonths(date: Date | number, amount: number): Date;
  export function differenceInDays(dateLeft: Date | number, dateRight: Date | number): number;
  export function differenceInHours(dateLeft: Date | number, dateRight: Date | number): number;
  export function differenceInMinutes(dateLeft: Date | number, dateRight: Date | number): number;
  export function isBefore(date: Date | number, dateToCompare: Date | number): boolean;
  export function isAfter(date: Date | number, dateToCompare: Date | number): boolean;
}
