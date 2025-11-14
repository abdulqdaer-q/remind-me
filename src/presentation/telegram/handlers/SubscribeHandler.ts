import { Context, Markup } from 'telegraf';
import { RegisterUserUseCase } from '../../../application/user/RegisterUserUseCase';
import { TranslationService } from '../../../infrastructure/i18n/TranslationService';

/**
 * Subscribe Command Handler
 * Handles the /subscribe command to request user location
 */
export class SubscribeHandler {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly translationService: TranslationService
  ) {}

  async handle(ctx: Context): Promise<void> {
    if (!ctx.from) {
      await ctx.reply('Unable to identify user.');
      return;
    }

    // Register or get user
    const user = await this.registerUserUseCase.execute({
      userId: ctx.from.id,
      username: ctx.from.username || null,
      displayName: ctx.from.first_name || 'User',
      languageCode: ctx.from.language_code,
    });

    const welcomeMessage = this.translationService.translate(
      'welcome-message',
      user.language
    );
    const locationPrompt = this.translationService.translate(
      'send-location-prompt',
      user.language
    );

    await ctx.reply(
      `${welcomeMessage}\n\n${locationPrompt}`,
      Markup.keyboard([Markup.button.locationRequest('📍 Send Location')])
        .resize()
        .oneTime()
    );
  }
}
