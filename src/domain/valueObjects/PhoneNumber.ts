export class PhoneNumber {
  private constructor(
    public readonly value: string,
  ) {}

  static create(value: string): PhoneNumber {
    const normalized = value.replace(/\s+/g, '');

    if (!normalized) {
      throw new Error('Phone number is required');
    }

    return new PhoneNumber(normalized);
  }
}
