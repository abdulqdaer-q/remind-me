/**
 * Location Value Object
 * Represents a geographical location with latitude and longitude
 */
export class Location {
  private constructor(
    private readonly _latitude: number,
    private readonly _longitude: number
  ) {
    this.validate();
  }

  static create(latitude: number, longitude: number): Location {
    return new Location(latitude, longitude);
  }

  private validate(): void {
    if (this._latitude < -90 || this._latitude > 90) {
      throw new Error('Latitude must be between -90 and 90 degrees');
    }
    if (this._longitude < -180 || this._longitude > 180) {
      throw new Error('Longitude must be between -180 and 180 degrees');
    }
  }

  get latitude(): number {
    return this._latitude;
  }

  get longitude(): number {
    return this._longitude;
  }

  equals(other: Location): boolean {
    return (
      this._latitude === other._latitude &&
      this._longitude === other._longitude
    );
  }

  toString(): string {
    return `${this._latitude},${this._longitude}`;
  }
}
