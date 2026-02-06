export type DateInput = Date | string | number;

export function toDate(input: DateInput): Date {
  if (input instanceof Date) {
    return input;
  }
  return new Date(input);
}

export function isValidDate(input: DateInput): boolean {
  const date = toDate(input);
  return !isNaN(date.getTime());
}

export function formatISO(date: DateInput): string {
  return toDate(date).toISOString();
}

export function formatDate(date: DateInput, locale = 'en-US'): string {
  return toDate(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateTime(date: DateInput, locale = 'en-US'): string {
  return toDate(date).toLocaleString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateShort(date: DateInput): string {
  const d = toDate(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function startOfDay(date: DateInput): Date {
  const d = toDate(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: DateInput): Date {
  const d = toDate(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function addDays(date: DateInput, days: number): Date {
  const d = toDate(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function addMonths(date: DateInput, months: number): Date {
  const d = toDate(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function addYears(date: DateInput, years: number): Date {
  const d = toDate(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

export function differenceInDays(dateLeft: DateInput, dateRight: DateInput): number {
  const left = startOfDay(dateLeft);
  const right = startOfDay(dateRight);
  return Math.round((left.getTime() - right.getTime()) / (1000 * 60 * 60 * 24));
}

export function differenceInYears(dateLeft: DateInput, dateRight: DateInput): number {
  const left = toDate(dateLeft);
  const right = toDate(dateRight);
  const years = left.getFullYear() - right.getFullYear();
  
  if (
    left.getMonth() < right.getMonth() ||
    (left.getMonth() === right.getMonth() && left.getDate() < right.getDate())
  ) {
    return years - 1;
  }
  return years;
}

export function isExpired(date: DateInput): boolean {
  return toDate(date).getTime() < Date.now();
}

export function isFuture(date: DateInput): boolean {
  return toDate(date).getTime() > Date.now();
}

export function isPast(date: DateInput): boolean {
  return toDate(date).getTime() < Date.now();
}

export function isToday(date: DateInput): boolean {
  const today = startOfDay(new Date());
  const compareDate = startOfDay(date);
  return today.getTime() === compareDate.getTime();
}

export function getAcademicYear(date: DateInput = new Date()): string {
  const d = toDate(date);
  const year = d.getFullYear();
  const month = d.getMonth();
  
  if (month >= 3) {
    return `${year}-${year + 1}`;
  }
  return `${year - 1}-${year}`;
}

export function calculateAge(birthDate: DateInput, referenceDate: DateInput = new Date()): number {
  return differenceInYears(referenceDate, birthDate);
}
