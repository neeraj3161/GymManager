export type PreviousDueAction = 'collect' | 'write_off' | 'carry_forward';

export interface CollectionValidationInput {
  collectAmount: number;
  previousDue: number;
  newPlanAmount: number;
  unusedCredit?: number;
}

export interface MembershipPaymentSummaryInput {
  planAmount: number;
  previousDue: number;
  previousDueAction: PreviousDueAction;
  collectAmount: number;
  unusedCredit?: number;
}

export interface MembershipPaymentSummary {
  baseAmount: number;
  collectedAmount: number;
  remainingPreviousDue: number;
  finalAmount: number;
  maxCollectableAmount: number;
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

export function calculateMembershipPaymentSummary({
  planAmount,
  previousDue,
  previousDueAction,
  collectAmount,
  unusedCredit = 0,
}: MembershipPaymentSummaryInput): MembershipPaymentSummary {
  const baseAmount = Math.max(planAmount - unusedCredit, 0);
  const collectedAmount =
    previousDueAction === 'collect' ? Math.max(collectAmount, 0) : 0;
  const remainingPreviousDue = getRemainingDue(previousDue, collectedAmount);

  let finalAmount = baseAmount;

  if (previousDueAction === 'collect') {
    finalAmount = baseAmount + remainingPreviousDue;
  } else if (previousDueAction === 'carry_forward') {
    finalAmount = baseAmount + previousDue;
  }

  return {
    baseAmount,
    collectedAmount,
    remainingPreviousDue,
    finalAmount,
    maxCollectableAmount: getMaxCollectableAmount({
      previousDue,
      newPlanAmount: baseAmount,
      unusedCredit,
    }),
  };
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

  if (maxAllowed === 0 && collectAmount === 0) {
    return {
      isValid: true,
      maxAllowed,
    };
  }

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
