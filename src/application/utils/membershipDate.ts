const DAY_IN_MS = 24 * 60 * 60 * 1000;

function parseDateOnly(dateValue: string): Date | null {
  if (!dateValue) return null;

  // Handles both YYYY-MM-DD and ISO timestamps.
  const dateString = dateValue.slice(0, 10);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return null;
  }

  const [year, month, day] = dateString.split('-').map(Number);

  const date = new Date(year, month - 1, day);
  date.setHours(0, 0, 0, 0);

  // Reject invalid dates such as 2026-02-31.
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

export function getMembershipDaysRemaining(endDate: string): number | null {
  const expiryDate = parseDateOnly(endDate);

  if (!expiryDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Math.round((expiryDate.getTime() - today.getTime()) / DAY_IN_MS);
}

export function isExpiringSoon(endDate: string, days = 7): boolean {
  const remaining = getMembershipDaysRemaining(endDate);

  return remaining !== null && remaining >= 0 && remaining <= days;
}

export function isExpired(endDate: string): boolean {
  const remaining = getMembershipDaysRemaining(endDate);

  return remaining !== null && remaining < 0;
}
