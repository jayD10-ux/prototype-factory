
// This file provides TypeScript definitions for the date-fns library
declare module 'date-fns' {
  export function format(date: Date | number, format: string, options?: Object): string;
  export function parseISO(dateString: string): Date;
  export function formatDistance(date: Date | number, baseDate: Date | number, options?: { addSuffix?: boolean, includeSeconds?: boolean }): string;
  export function formatDistanceToNow(date: Date | number, options?: { addSuffix?: boolean, includeSeconds?: boolean }): string;
  export function formatRelative(date: Date | number, baseDate: Date | number, options?: Object): string;
  export function differenceInDays(dateLeft: Date | number, dateRight: Date | number): number;
  export function addDays(date: Date | number, amount: number): Date;
  export function isAfter(date: Date | number, dateToCompare: Date | number): boolean;
  export function isBefore(date: Date | number, dateToCompare: Date | number): boolean;
  export function isSameDay(dateLeft: Date | number, dateRight: Date | number): boolean;
  export function isToday(date: Date | number): boolean;
  export function isYesterday(date: Date | number): boolean;
  // Add other functions as needed
}
