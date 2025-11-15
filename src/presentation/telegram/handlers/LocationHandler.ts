import { Context, Markup } from 'telegraf';
import { message } from 'telegraf/filters';
import { RegisterUserUseCase } from '../../../application/user/RegisterUserUseCase';
import { UpdateUserLocationUseCase } from '../../../application/user/UpdateUserLocationUseCase';
import { SubscribeUserUseCase } from '../../../application/user/SubscribeUserUseCase';
import { GrpcTranslationService } from '../../../infrastructure/i18n/GrpcTranslationService';
import { Handler, On } from '../../../core/di/decorators';
import { TOKENS } from '../../../core/di/tokens';
import { BaseHandler } from '../../../core/handlers/BaseHandler';
import { BotContext, SessionManager } from '../../../infrastructure/telegram/Session';

/**
 * Location Event Handler
 * Handles location messages from users (both onboarding and regular)
 */
@Handler(
  TOKENS.RegisterUserUseCase,
  TOKENS.UpdateUserLocationUseCase,
  TOKENS.SubscribeUserUseCase,
  TOKENS.TranslationService,
  TOKENS.SessionManager
)
export class LocationHandler extends BaseHandler {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly updateUserLocationUseCase: UpdateUserLocationUseCase,
    private readonly subscribeUserUseCase: SubscribeUserUseCase,
    private readonly translationService: GrpcTranslationService,
    private readonly sessionManager: SessionManager
  ) {
    super();
  }

  @On('location')
  async handle(ctx: BotContext): Promise<void> {
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

    // Check if this is during onboarding
    if (ctx.session?.conversationState === 'AWAITING_LOCATION') {
      // Handle onboarding flow
      await this.handleOnboardingLocation(ctx, location);
    } else {
      // Handle regular location update
      await this.handleRegularLocation(ctx, user);
    }
  }

  /**
   * Handle location during onboarding
   */
  private async handleOnboardingLocation(ctx: BotContext, location: { latitude: number; longitude: number }): Promise<void> {
    const userId = ctx.from?.id;
    if (!userId) return;

    // Get user after location update
    const user = await this.registerUserUseCase.execute({
      userId,
      username: ctx.from?.username || null,
      displayName: ctx.from?.first_name || 'User',
      languageCode: ctx.from?.language_code,
    });

    // Update session
    const chatId = ctx.chat?.id;
    if (chatId) {
      this.sessionManager.updateSession(chatId, {
        tempData: {
          ...ctx.session?.tempData,
          location: {
            latitude: location.latitude,
            longitude: location.longitude,
          },
        },
        conversationState: 'AWAITING_FUNCTIONALITIES',
      });
    }

    // Acknowledge location save
    await ctx.reply(
      await this.translationService.translate('location-saved', user.language),
      Markup.removeKeyboard()
    );

    // Ask for functionality preferences
    const functionalitiesText = await this.translationService.translate(
      'choose-functionalities',
      user.language
    );
    const reminderText = await this.translationService.translate(
      'functionality-reminder',
      user.language
    );
    const trackerText = await this.translationService.translate(
      'functionality-tracker',
      user.language
    );
    const remindByCallText = await this.translationService.translate(
      'functionality-remind-by-call',
      user.language
    );
    const skipText = await this.translationService.translate('button-skip', user.language);

    await ctx.reply(
      functionalitiesText,
      Markup.inlineKeyboard([
        [Markup.button.callback(reminderText, 'func_reminder')],
        [Markup.button.callback(trackerText, 'func_tracker')],
        [Markup.button.callback(remindByCallText, 'func_remind_by_call')],
        [Markup.button.callback(`✅ ${skipText}`, 'func_done')],
      ])
    );
  }

  /**
   * Handle regular location update
   */
  private async handleRegularLocation(ctx: BotContext, user: any): Promise<void> {
    // Subscribe user to reminders
    await this.subscribeUserUseCase.execute({
      userId: ctx.from!.id,
    });

    const locationReceivedMsg = await this.translationService.translate(
      'location-received',
      user.language
    );
    const subscriptionSuccessMsg = await this.translationService.translate(
      'subscription-success',
      user.language
    );

    await ctx.reply(
      `${locationReceivedMsg}\n\n✅ ${subscriptionSuccessMsg}`,
      Markup.removeKeyboard()
    );
  }
}
