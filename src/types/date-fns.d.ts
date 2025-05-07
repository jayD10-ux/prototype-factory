
declare module 'date-fns' {
  // Basic date-fns functions used in the project
  export function format(date: Date | number, format: string, options?: object): string;
  export function formatDistance(date: Date | number, baseDate: Date | number, options?: object): string;
  export function formatRelative(date: Date | number, baseDate: Date | number, options?: object): string;
  export function isToday(date: Date | number): boolean;
  export function isYesterday(date: Date | number): boolean;
  export function parseISO(dateString: string): Date;
}
