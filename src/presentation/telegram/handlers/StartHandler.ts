import { Markup } from 'telegraf';
import { BotContext, SessionManager } from '../../../infrastructure/telegram/Session';
import { RegisterUserUseCase } from '../../../application/user/RegisterUserUseCase';
import { UpdateUserLocationUseCase } from '../../../application/user/UpdateUserLocationUseCase';
import { TranslationService } from '../../../infrastructure/i18n/TranslationService';
import { Language } from '../../../domain/shared/Language';
import { User } from '../../../domain/user/User';

/**
 * Start Command Handler
 * Handles the /start command and the complete onboarding flow
 */
export class StartHandler {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly updateUserLocationUseCase: UpdateUserLocationUseCase,
    private readonly translationService: TranslationService,
    private readonly sessionManager: SessionManager
  ) {}

  /**
   * Handles the /start command
   */
  async handleStart(ctx: BotContext): Promise<void> {
    const userId = ctx.from?.id;
    if (!userId) return;

    // Create or get user
    await this.registerUserUseCase.execute({
      userId,
      username: ctx.from?.username || null,
      displayName: ctx.from?.first_name || 'User',
      languageCode: ctx.from?.language_code,
    });

    // Set conversation state
    const chatId = ctx.chat?.id;
    if (chatId) {
      this.sessionManager.updateSession(chatId, {
        conversationState: 'AWAITING_LANGUAGE',
      });
    }

    // Send welcome message with language selection
    const welcomeText = this.translationService.translate(
      'start-welcome',
      Language.default()
    );
    const chooseLanguageText = this.translationService.translate(
      'choose-language',
      Language.default()
    );

    await ctx.reply(
      `${welcomeText}\n\n${chooseLanguageText}`,
      Markup.inlineKeyboard([
        [
          Markup.button.callback('🇬🇧 English', 'lang_en'),
          Markup.button.callback('🇸🇦 العربية', 'lang_ar'),
        ],
      ])
    );
  }

  /**
   * Handles language selection callback
   */
  async handleLanguageSelection(ctx: BotContext): Promise<void> {
    const userId = ctx.from?.id;
    if (!userId || !ctx.match) return;

    const languageCode = ctx.match[1]; // 'en' or 'ar'
    const language = Language.create(languageCode);

    // Get and update user
    const user = await this.registerUserUseCase.execute({
      userId,
      username: ctx.from?.username || null,
      displayName: ctx.from?.first_name || 'User',
      languageCode,
    });

    // Update session
    const chatId = ctx.chat?.id;
    if (chatId) {
      this.sessionManager.updateSession(chatId, {
        tempData: { language: languageCode },
        conversationState: 'AWAITING_LOCATION',
      });
    }

    // Acknowledge language selection
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      this.translationService.translate('language-selected', language)
    );

    // Request location
    const locationText = this.translationService.translate(
      'request-location',
      language
    );
    const buttonText = this.translationService.translate(
      'button-send-location',
      language
    );

    await ctx.reply(
      locationText,
      Markup.keyboard([[Markup.button.locationRequest(buttonText)]]).resize()
    );
  }

  /**
   * Handles location sharing during onboarding
   */
  async handleLocationDuringOnboarding(ctx: BotContext, user: User): Promise<void> {
    // Check if we're expecting location
    if (ctx.session?.conversationState !== 'AWAITING_LOCATION') {
      return;
    }

    if (!ctx.message || !('location' in ctx.message)) {
      return;
    }

    const location = ctx.message.location;
    const userId = ctx.from?.id;
    if (!userId) return;

    // Save location to user
    await this.updateUserLocationUseCase.execute({
      userId,
      latitude: location.latitude,
      longitude: location.longitude,
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
      this.translationService.translate('location-saved', user.language),
      Markup.removeKeyboard()
    );

    // Ask for functionality preferences
    const functionalitiesText = this.translationService.translate(
      'choose-functionalities',
      user.language
    );
    const reminderText = this.translationService.translate(
      'functionality-reminder',
      user.language
    );
    const trackerText = this.translationService.translate(
      'functionality-tracker',
      user.language
    );
    const remindByCallText = this.translationService.translate(
      'functionality-remind-by-call',
      user.language
    );
    const skipText = this.translationService.translate('button-skip', user.language);

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
   * Handles functionality selection callback
   */
  async handleFunctionalitySelection(ctx: BotContext, user: User): Promise<void> {
    const userId = ctx.from?.id;
    if (!userId || !ctx.match) return;

    const functionality = ctx.match[1];

    if (functionality === 'done') {
      // Complete setup
      const chatId = ctx.chat?.id;
      if (chatId) {
        this.sessionManager.clearSession(chatId);
      }

      const hasSelections = user.functionalities.hasAnyEnabled();

      const completeText = hasSelections
        ? this.translationService.translate(
            'setup-complete-with-selections',
            user.language
          )
        : this.translationService.translate('setup-complete', user.language);

      await ctx.answerCbQuery();
      await ctx.editMessageText(completeText);
    } else {
      // Toggle functionality
      const funcType = functionality as 'reminder' | 'tracker' | 'remindByCall';
      user.toggleFunctionality(funcType);

      // Save user with updated functionalities
      await this.registerUserUseCase.execute({
        userId,
        username: user.username,
        displayName: user.displayName,
        languageCode: user.language.code,
      });

      // Update the keyboard to show checkmarks
      const reminderText = this.translationService.translate(
        'functionality-reminder',
        user.language
      );
      const trackerText = this.translationService.translate(
        'functionality-tracker',
        user.language
      );
      const remindByCallText = this.translationService.translate(
        'functionality-remind-by-call',
        user.language
      );
      const skipText = this.translationService.translate(
        'button-skip',
        user.language
      );

      const funcs = user.functionalities;

      await ctx.answerCbQuery();
      await ctx.editMessageReplyMarkup({
        inline_keyboard: [
          [
            Markup.button.callback(
              `${funcs.reminder ? '✅ ' : ''}${reminderText}`,
              'func_reminder'
            ),
          ],
          [
            Markup.button.callback(
              `${funcs.tracker ? '✅ ' : ''}${trackerText}`,
              'func_tracker'
            ),
          ],
          [
            Markup.button.callback(
              `${funcs.remindByCall ? '✅ ' : ''}${remindByCallText}`,
              'func_remind_by_call'
            ),
          ],
          [Markup.button.callback(`✅ ${skipText}`, 'func_done')],
        ],
      });
    }
  }
}
