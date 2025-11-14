import { User } from '../../domain/user/User';
import { UserId } from '../../domain/user/UserId';
import { UserRepository } from '../../domain/user/UserRepository';
import { Language } from '../../domain/shared/Language';

export interface RegisterUserCommand {
  userId: number;
  username: string | null;
  displayName: string;
  languageCode?: string;
}

/**
 * Register User Use Case
 * Handles user registration or retrieval
 */
export class RegisterUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(command: RegisterUserCommand): Promise<User> {
    const userId = UserId.create(command.userId);

    // Check if user already exists
    const existingUser = await this.userRepository.findById(userId);
    if (existingUser) {
      // Update user profile if changed
      existingUser.updateProfile(command.username, command.displayName);
      await this.userRepository.save(existingUser);
      return existingUser;
    }

    // Create new user
    const language = command.languageCode
      ? Language.create(command.languageCode)
      : Language.default();

    const user = User.create(
      userId,
      command.username,
      command.displayName,
      language
    );

    await this.userRepository.save(user);
    return user;
  }
}
