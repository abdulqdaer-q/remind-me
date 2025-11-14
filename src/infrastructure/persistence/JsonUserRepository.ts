import { promises as fs } from 'fs';
import { join } from 'path';
import { UserRepository } from '../../domain/user/UserRepository';
import { User } from '../../domain/user/User';
import { UserId } from '../../domain/user/UserId';
import { Language } from '../../domain/shared/Language';
import { Location } from '../../domain/location/Location';
import { Functionalities } from '../../domain/user/Functionalities';

interface UserData {
  username: string | null;
  displayName: string;
  isActive: boolean;
  preferences: {
    language: string;
    isSubscribed: boolean;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
  functionalities?: {
    reminder: boolean;
    tracker: boolean;
    remindByCall: boolean;
  };
}

type DatabaseSchema = Record<string, UserData>;

/**
 * JSON-based User Repository Implementation
 * Persists users to a JSON file
 */
export class JsonUserRepository implements UserRepository {
  private readonly filePath: string;
  private cache: Map<number, User> = new Map();
  private isDirty = false;

  constructor(filePath: string = join(process.cwd(), 'src', 'db.json')) {
    this.filePath = filePath;
  }

  async save(user: User): Promise<void> {
    await this.loadCache();
    this.cache.set(user.id.value, user);
    this.isDirty = true;
    await this.persist();
  }

  async findById(id: UserId): Promise<User | null> {
    await this.loadCache();
    return this.cache.get(id.value) || null;
  }

  async findAllActive(): Promise<User[]> {
    await this.loadCache();
    return Array.from(this.cache.values()).filter((user) => user.isActive);
  }

  async findAllSubscribed(): Promise<User[]> {
    await this.loadCache();
    return Array.from(this.cache.values()).filter((user) => user.isSubscribed);
  }

  async delete(id: UserId): Promise<void> {
    await this.loadCache();
    this.cache.delete(id.value);
    this.isDirty = true;
    await this.persist();
  }

  private async loadCache(): Promise<void> {
    if (this.cache.size > 0 && !this.isDirty) {
      return; // Cache is already loaded and up-to-date
    }

    try {
      const data = await fs.readFile(this.filePath, 'utf-8');
      const db: DatabaseSchema = JSON.parse(data);

      this.cache.clear();
      for (const [userIdStr, userData] of Object.entries(db)) {
        const userId = UserId.create(parseInt(userIdStr, 10));
        const language = Language.create(userData.preferences.language);
        const location = userData.location
          ? Location.create(userData.location.latitude, userData.location.longitude)
          : null;
        const functionalities = userData.functionalities
          ? Functionalities.create(
              userData.functionalities.reminder,
              userData.functionalities.tracker,
              userData.functionalities.remindByCall
            )
          : Functionalities.none();

        const user = User.reconstitute(
          userId,
          userData.username,
          userData.displayName,
          language,
          location,
          functionalities,
          userData.preferences.isSubscribed,
          userData.isActive
        );

        this.cache.set(userId.value, user);
      }
      this.isDirty = false;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, start with empty cache
        this.cache.clear();
      } else {
        throw error;
      }
    }
  }

  private async persist(): Promise<void> {
    const db: DatabaseSchema = {};

    for (const [userIdValue, user] of this.cache.entries()) {
      db[userIdValue.toString()] = {
        username: user.username,
        displayName: user.displayName,
        isActive: user.isActive,
        preferences: {
          language: user.language.code,
          isSubscribed: user.isSubscribed,
        },
        location: user.location
          ? {
              latitude: user.location.latitude,
              longitude: user.location.longitude,
            }
          : undefined,
        functionalities: user.functionalities.toJSON(),
      };
    }

    await fs.writeFile(this.filePath, JSON.stringify(db, null, 2), 'utf-8');
    this.isDirty = false;
  }
}
