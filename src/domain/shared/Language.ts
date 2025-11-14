/**
 * Language Value Object
 * Represents a supported language in the system
 */
export class Language {
  private static readonly SUPPORTED_LANGUAGES = ['en', 'ar'] as const;

  private constructor(private readonly _code: string) {
    this.validate();
  }

  static create(code: string): Language {
    return new Language(code);
  }

  static default(): Language {
    return new Language('en');
  }

  private validate(): void {
    if (!Language.SUPPORTED_LANGUAGES.includes(this._code as any)) {
      throw new Error(
        `Unsupported language: ${this._code}. Supported languages: ${Language.SUPPORTED_LANGUAGES.join(', ')}`
      );
    }
  }

  get code(): string {
    return this._code;
  }

  equals(other: Language): boolean {
    return this._code === other._code;
  }

  toString(): string {
    return this._code;
  }
}
