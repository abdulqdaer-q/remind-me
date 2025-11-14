/**
 * Functionalities Value Object
 * Represents the features a user has enabled
 */
export class Functionalities {
  private constructor(
    private readonly _reminder: boolean,
    private readonly _tracker: boolean,
    private readonly _remindByCall: boolean
  ) {}

  static create(
    reminder: boolean = false,
    tracker: boolean = false,
    remindByCall: boolean = false
  ): Functionalities {
    return new Functionalities(reminder, tracker, remindByCall);
  }

  static none(): Functionalities {
    return new Functionalities(false, false, false);
  }

  static all(): Functionalities {
    return new Functionalities(true, true, true);
  }

  get reminder(): boolean {
    return this._reminder;
  }

  get tracker(): boolean {
    return this._tracker;
  }

  get remindByCall(): boolean {
    return this._remindByCall;
  }

  withReminder(enabled: boolean): Functionalities {
    return new Functionalities(enabled, this._tracker, this._remindByCall);
  }

  withTracker(enabled: boolean): Functionalities {
    return new Functionalities(this._reminder, enabled, this._remindByCall);
  }

  withRemindByCall(enabled: boolean): Functionalities {
    return new Functionalities(this._reminder, this._tracker, enabled);
  }

  hasAnyEnabled(): boolean {
    return this._reminder || this._tracker || this._remindByCall;
  }

  equals(other: Functionalities): boolean {
    return (
      this._reminder === other._reminder &&
      this._tracker === other._tracker &&
      this._remindByCall === other._remindByCall
    );
  }

  toJSON() {
    return {
      reminder: this._reminder,
      tracker: this._tracker,
      remindByCall: this._remindByCall,
    };
  }
}
