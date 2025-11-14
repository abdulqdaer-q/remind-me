import { User } from './User';
import { UserId } from './UserId';

/**
 * User Repository Interface
 * Defines the contract for user persistence
 */
export interface UserRepository {
  /**
   * Saves a user (create or update)
   */
  save(user: User): Promise<void>;

  /**
   * Finds a user by ID
   */
  findById(id: UserId): Promise<User | null>;

  /**
   * Finds all active users
   */
  findAllActive(): Promise<User[]>;

  /**
   * Finds all subscribed users
   */
  findAllSubscribed(): Promise<User[]>;

  /**
   * Deletes a user by ID
   */
  delete(id: UserId): Promise<void>;
}
