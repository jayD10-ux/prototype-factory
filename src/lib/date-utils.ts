
import { format, formatDistance, formatRelative, isToday, isYesterday, parseISO } from 'date-fns';

// Helper functions for working with dates
export const formatDate = (date: string | Date): string => {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  
  if (isToday(parsedDate)) {
    return `Today, ${format(parsedDate, 'h:mm a')}`;
  } else if (isYesterday(parsedDate)) {
    return `Yesterday, ${format(parsedDate, 'h:mm a')}`;
  } else {
    return format(parsedDate, 'MMM d, yyyy h:mm a');
  }
};

export const getRelativeTime = (date: string | Date): string => {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return formatDistance(parsedDate, new Date(), { addSuffix: true });
};

export const formatDateRelative = (date: string | Date): string => {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return formatRelative(parsedDate, new Date());
};
