
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
}
