import { UserId } from './UserId';
import { Language } from '../shared/Language';
import { Location } from '../location/Location';
import { Functionalities } from './Functionalities';

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
    private _functionalities: Functionalities,
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
      Functionalities.none(),
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
    functionalities: Functionalities,
    isSubscribed: boolean,
    isActive: boolean
  ): User {
    return new User(
      id,
      username,
      displayName,
      language,
      location,
      functionalities,
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

  get functionalities(): Functionalities {
    return this._functionalities;
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

  updateFunctionalities(functionalities: Functionalities): void {
    this._functionalities = functionalities;
  }

  enableFunctionality(type: 'reminder' | 'tracker' | 'remindByCall'): void {
    switch (type) {
      case 'reminder':
        this._functionalities = this._functionalities.withReminder(true);
        break;
      case 'tracker':
        this._functionalities = this._functionalities.withTracker(true);
        break;
      case 'remindByCall':
        this._functionalities = this._functionalities.withRemindByCall(true);
        break;
    }
  }

  disableFunctionality(type: 'reminder' | 'tracker' | 'remindByCall'): void {
    switch (type) {
      case 'reminder':
        this._functionalities = this._functionalities.withReminder(false);
        break;
      case 'tracker':
        this._functionalities = this._functionalities.withTracker(false);
        break;
      case 'remindByCall':
        this._functionalities = this._functionalities.withRemindByCall(false);
        break;
    }
  }

  toggleFunctionality(type: 'reminder' | 'tracker' | 'remindByCall'): void {
    switch (type) {
      case 'reminder':
        this._functionalities = this._functionalities.withReminder(!this._functionalities.reminder);
        break;
      case 'tracker':
        this._functionalities = this._functionalities.withTracker(!this._functionalities.tracker);
        break;
      case 'remindByCall':
        this._functionalities = this._functionalities.withRemindByCall(!this._functionalities.remindByCall);
        break;
    }
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
