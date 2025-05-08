
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
}
