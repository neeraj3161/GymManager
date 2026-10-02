export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const originalDay = result.getDate();

  result.setDate(1);
  result.setMonth(result.getMonth() + months);

  const lastDay = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0,
  ).getDate();

  result.setDate(Math.min(originalDay, lastDay));

  return result;
}

export function calculateMembershipEndDate(
  startDate: Date,
  durationMonths: number,
): Date {
  const endDate = addMonths(startDate, durationMonths);
  endDate.setDate(endDate.getDate() - 1);
  return endDate;
}

export function parseDateOnly(value: string): Date | null {
  const match = /^\d{4}-\d{2}-\d{2}$/.exec(value.trim());

  if (!match) {
    return null;
  }

  const [year, month, day] = value
    .trim()
    .split('-')
    .map(part => Number(part));

  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return startOfDay(date);
}

export function formatDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function isToday(date: Date): boolean {
  const now = new Date();

  return (
    now.getFullYear() === date.getFullYear() &&
    now.getMonth() === date.getMonth() &&
    now.getDate() === date.getDate()
  );
}

export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function startOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}
