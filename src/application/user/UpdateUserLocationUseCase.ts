import { User } from '../../domain/user/User';
import { UserId } from '../../domain/user/UserId';
import { UserRepository } from '../../domain/user/UserRepository';
import { Location } from '../../domain/location/Location';

export interface UpdateUserLocationCommand {
  userId: number;
  latitude: number;
  longitude: number;
}

/**
 * Update User Location Use Case
 * Updates a user's location
 */
export class UpdateUserLocationUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(command: UpdateUserLocationCommand): Promise<User> {
    const userId = UserId.create(command.userId);

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error(`User not found: ${command.userId}`);
    }

    const location = Location.create(command.latitude, command.longitude);
    user.updateLocation(location);

    await this.userRepository.save(user);
    return user;
  }
}
