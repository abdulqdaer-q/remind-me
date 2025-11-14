/**
 * User ID Value Object
 * Represents a unique identifier for a user (Telegram user ID)
 */
export class UserId {
  private constructor(private readonly _value: number) {
    this.validate();
  }

  static create(value: number): UserId {
    return new UserId(value);
  }

  private validate(): void {
    if (!Number.isInteger(this._value)) {
      throw new Error('User ID must be an integer');
    }
  }

  get value(): number {
    return this._value;
  }

  equals(other: UserId): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value.toString();
  }
}
