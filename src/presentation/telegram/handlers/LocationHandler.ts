import { Context, Markup } from 'telegraf';
import { message } from 'telegraf/filters';
import { RegisterUserUseCase } from '../../../application/user/RegisterUserUseCase';
import { UpdateUserLocationUseCase } from '../../../application/user/UpdateUserLocationUseCase';
import { SubscribeUserUseCase } from '../../../application/user/SubscribeUserUseCase';
import { TranslationService } from '../../../infrastructure/i18n/TranslationService';

/**
 * Location Event Handler
 * Handles location messages from users
 */
export class LocationHandler {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly updateUserLocationUseCase: UpdateUserLocationUseCase,
    private readonly subscribeUserUseCase: SubscribeUserUseCase,
    private readonly translationService: TranslationService
  ) {}

  async handle(ctx: Context): Promise<void> {
    if (!ctx.from) {
      await ctx.reply('Unable to identify user.');
      return;
    }

    // Type guard to ensure we have location
    if (!('message' in ctx.update) || !('location' in ctx.update.message)) {
      return;
    }

    const location = ctx.update.message.location;

    // Register or get user
    const user = await this.registerUserUseCase.execute({
      userId: ctx.from.id,
      username: ctx.from.username || null,
      displayName: ctx.from.first_name || 'User',
      languageCode: ctx.from.language_code,
    });

    // Update user location
    await this.updateUserLocationUseCase.execute({
      userId: ctx.from.id,
      latitude: location.latitude,
      longitude: location.longitude,
    });

    // Subscribe user to reminders
    await this.subscribeUserUseCase.execute({
      userId: ctx.from.id,
    });

    const locationReceivedMsg = this.translationService.translate(
      'location-received',
      user.language
    );
    const subscriptionSuccessMsg = this.translationService.translate(
      'subscription-success',
      user.language
    );

    await ctx.reply(
      `${locationReceivedMsg}\n\n✅ ${subscriptionSuccessMsg}`,
      Markup.removeKeyboard()
    );
  }
}
