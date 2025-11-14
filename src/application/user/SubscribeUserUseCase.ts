import { User } from '../../domain/user/User';
import { UserId } from '../../domain/user/UserId';
import { UserRepository } from '../../domain/user/UserRepository';

export interface SubscribeUserCommand {
  userId: number;
}

/**
 * Subscribe User Use Case
 * Subscribes a user to prayer time reminders
 */
export class SubscribeUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(command: SubscribeUserCommand): Promise<User> {
    const userId = UserId.create(command.userId);

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error(`User not found: ${command.userId}`);
    }

    if (!user.hasLocation()) {
      throw new Error('User must have a location to subscribe');
    }

    user.subscribe();

    await this.userRepository.save(user);
    return user;
  }
}
