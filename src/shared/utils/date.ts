export function addMonths(
  date: Date,
  months: number,
): Date {
  const result = new Date(date);
  const originalDay = result.getDate();

  result.setDate(1);
  result.setMonth(
    result.getMonth() + months,
  );

  const lastDay = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0,
  ).getDate();

  result.setDate(
    Math.min(originalDay, lastDay),
  );

  return result;
}

export function isToday(
  date: Date,
): boolean {
  const now = new Date();

  return (
    now.getFullYear() === date.getFullYear() &&
    now.getMonth() === date.getMonth() &&
    now.getDate() === date.getDate()
  );
}
