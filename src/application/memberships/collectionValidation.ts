export interface CollectionValidationInput {
  collectAmount: number;
  previousDue: number;
  newPlanAmount: number;
  unusedCredit?: number;
}

export function getMaxCollectableAmount({
  previousDue,
}: {
  previousDue: number;
  newPlanAmount: number;
  unusedCredit?: number;
}): number {
  return Math.max(previousDue, 0);
}

export function getRemainingDue(
  previousDue: number,
  collectedAmount: number,
): number {
  return Math.max(previousDue - collectedAmount, 0);
}

export function validateCollectionAmount({
  collectAmount,
  previousDue,
  newPlanAmount,
  unusedCredit = 0,
}: CollectionValidationInput): {
  isValid: boolean;
  maxAllowed: number;
  message?: string;
} {
  const maxAllowed = getMaxCollectableAmount({
    previousDue,
    newPlanAmount,
    unusedCredit,
  });

  if (!Number.isFinite(collectAmount) || collectAmount <= 0) {
    return {
      isValid: false,
      maxAllowed,
      message: 'Please enter a valid collection amount greater than zero.',
    };
  }

  if (collectAmount > maxAllowed) {
    return {
      isValid: false,
      maxAllowed,
      message: `Collection amount cannot exceed ₹${maxAllowed.toLocaleString(
        'en-IN',
      )}.`,
    };
  }

  return {
    isValid: true,
    maxAllowed,
  };
}
