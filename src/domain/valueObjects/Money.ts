export class Money {
  private constructor(
    public readonly amount: number,
  ) {}

  static create(amount: number): Money {
    if (!Number.isFinite(amount)) {
      throw new Error('Invalid amount');
    }

    if (amount < 0) {
      throw new Error('Amount cannot be negative');
    }

    return new Money(amount);
  }
}
