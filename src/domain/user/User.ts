import { UserId } from './UserId';
import { Language } from '../shared/Language';
import { Location } from '../location/Location';

/**
 * User Entity
 * Represents a user in the system with their preferences
 */
export class User {
  private constructor(
    private readonly _id: UserId,
    private _username: string | null,
    private _displayName: string,
    private _language: Language,
    private _location: Location | null,
    private _isSubscribed: boolean,
    private _isActive: boolean
  ) {}

  static create(
    id: UserId,
    username: string | null,
    displayName: string,
    language?: Language,
    location?: Location | null
  ): User {
    return new User(
      id,
      username,
      displayName,
      language || Language.default(),
      location || null,
      false,
      true
    );
  }

  static reconstitute(
    id: UserId,
    username: string | null,
    displayName: string,
    language: Language,
    location: Location | null,
    isSubscribed: boolean,
    isActive: boolean
  ): User {
    return new User(
      id,
      username,
      displayName,
      language,
      location,
      isSubscribed,
      isActive
    );
  }

  // Getters
  get id(): UserId {
    return this._id;
  }

  get username(): string | null {
    return this._username;
  }

  get displayName(): string {
    return this._displayName;
  }

  get language(): Language {
    return this._language;
  }

  get location(): Location | null {
    return this._location;
  }

  get isSubscribed(): boolean {
    return this._isSubscribed;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  // Business methods
  updateProfile(username: string | null, displayName: string): void {
    this._username = username;
    this._displayName = displayName;
  }

  changeLanguage(language: Language): void {
    this._language = language;
  }

  updateLocation(location: Location): void {
    this._location = location;
  }

  subscribe(): void {
    if (!this._location) {
      throw new Error('Cannot subscribe without a location');
    }
    this._isSubscribed = true;
  }

  unsubscribe(): void {
    this._isSubscribed = false;
  }

  activate(): void {
    this._isActive = true;
  }

  deactivate(): void {
    this._isActive = false;
  }

  hasLocation(): boolean {
    return this._location !== null;
  }

  equals(other: User): boolean {
    return this._id.equals(other._id);
  }
}
