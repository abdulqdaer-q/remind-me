import { Markup } from 'telegraf';
import { BotContext, SessionManager } from '../../../infrastructure/telegram/Session';
import { RegisterUserUseCase } from '../../../application/user/RegisterUserUseCase';
import { UpdateUserLocationUseCase } from '../../../application/user/UpdateUserLocationUseCase';
import { GrpcTranslationService } from '../../../infrastructure/i18n/GrpcTranslationService';
import { Language } from '../../../domain/shared/Language';
import { User } from '../../../domain/user/User';
import { Handler, Command, Action } from '../../../core/di/decorators';
import { TOKENS } from '../../../core/di/tokens';
import { BaseHandler } from '../../../core/handlers/BaseHandler';

/**
 * Start Command Handler
 * Handles the /start command and the complete onboarding flow
 */
@Handler(
  TOKENS.RegisterUserUseCase,
  TOKENS.UpdateUserLocationUseCase,
  TOKENS.TranslationService,
  TOKENS.SessionManager
)
export class StartHandler extends BaseHandler {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly updateUserLocationUseCase: UpdateUserLocationUseCase,
    private readonly translationService: GrpcTranslationService,
    private readonly sessionManager: SessionManager
  ) {
    super();
  }

  /**
   * Handles the /start command
   * Supports both private chats (individual users) and groups
   */
  @Command('start')
  async handleStart(ctx: BotContext): Promise<void> {
    const chatId = ctx.chat?.id;
    if (!chatId) return;

    const userId = ctx.from?.id;
    if (!userId) return;

    // Determine if this is a group or private chat
    const isGroup = ctx.chat?.type === 'group' || ctx.chat?.type === 'supergroup';

    // For groups, register the group chat ID as the user ID
    // For private chats, use the actual user ID
    const entityId = isGroup ? chatId : userId;
    const entityName = isGroup
      ? (ctx.chat?.title || 'Group Chat')
      : (ctx.from?.first_name || 'User');
    const entityUsername = isGroup ? null : (ctx.from?.username || null);

    // Create or get user/group
    await this.registerUserUseCase.execute({
      userId: entityId,
      username: entityUsername,
      displayName: entityName,
      languageCode: ctx.from?.language_code,
    });

    // Set conversation state
    if (chatId) {
      this.sessionManager.updateSession(chatId, {
        conversationState: 'AWAITING_LANGUAGE',
      });
    }

    // Send welcome message with language selection
    const welcomePrefix = isGroup
      ? `👥 *Group Setup*\n\nWelcome to the Prayer Reminder Bot!\n\n`
      : '';

    const welcomeText = await this.translationService.translate(
      'start-welcome',
      Language.default()
    );
    const chooseLanguageText = await this.translationService.translate(
      'choose-language',
      Language.default()
    );

    await ctx.reply(
      `${welcomePrefix}${welcomeText}\n\n${chooseLanguageText}`,
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
  @Action(/^lang_(.+)$/)
  async handleLanguageSelection(ctx: BotContext): Promise<void> {
    const userId = ctx.from?.id;
    const chatId = ctx.chat?.id;
    if (!userId || !chatId || !ctx.match) return;

    const languageCode = ctx.match[1]; // 'en' or 'ar'
    const language = Language.create(languageCode);

    // Determine if this is a group or private chat
    const isGroup = ctx.chat?.type === 'group' || ctx.chat?.type === 'supergroup';

    // For groups, use chat ID; for private chats, use user ID
    const entityId = isGroup ? chatId : userId;
    const entityName = isGroup
      ? (ctx.chat?.title || 'Group Chat')
      : (ctx.from?.first_name || 'User');
    const entityUsername = isGroup ? null : (ctx.from?.username || null);

    // Get and update user/group
    const user = await this.registerUserUseCase.execute({
      userId: entityId,
      username: entityUsername,
      displayName: entityName,
      languageCode,
    });

    // Update session
    if (chatId) {
      this.sessionManager.updateSession(chatId, {
        tempData: { language: languageCode },
        conversationState: 'AWAITING_LOCATION',
      });
    }

    // Acknowledge language selection
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      await this.translationService.translate('language-selected', language)
    );

    // Request location
    const locationText = await this.translationService.translate(
      'request-location',
      language
    );
    const buttonText = await this.translationService.translate(
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
    const chatId = ctx.chat?.id;
    if (!userId || !chatId) return;

    // Determine if this is a group or private chat
    const isGroup = ctx.chat?.type === 'group' || ctx.chat?.type === 'supergroup';
    const entityId = isGroup ? chatId : userId;

    // Save location to user/group
    await this.updateUserLocationUseCase.execute({
      userId: entityId,
      latitude: location.latitude,
      longitude: location.longitude,
    });

    // Update session
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
   * Handles functionality selection callback
   */
  @Action(/^func_(.+)$/)
  async handleFunctionalitySelection(ctx: BotContext): Promise<void> {
    const userId = ctx.from?.id;
    const chatId = ctx.chat?.id;
    if (!userId || !chatId || !ctx.match) return;

    // Determine if this is a group or private chat
    const isGroup = ctx.chat?.type === 'group' || ctx.chat?.type === 'supergroup';
    const entityId = isGroup ? chatId : userId;
    const entityName = isGroup
      ? (ctx.chat?.title || 'Group Chat')
      : (ctx.from?.first_name || 'User');
    const entityUsername = isGroup ? null : (ctx.from?.username || null);

    // Get user/group
    const user = await this.registerUserUseCase.execute({
      userId: entityId,
      username: entityUsername,
      displayName: entityName,
      languageCode: ctx.from?.language_code,
    });

    const functionality = ctx.match[1];

    if (functionality === 'done') {
      // Complete setup
      if (chatId) {
        this.sessionManager.clearSession(chatId);
      }

      const hasSelections = user.functionalities.hasAnyEnabled();

      const completeText = hasSelections
        ? await this.translationService.translate(
            'setup-complete-with-selections',
            user.language
          )
        : await this.translationService.translate('setup-complete', user.language);

      await ctx.answerCbQuery();
      await ctx.editMessageText(completeText);
    } else {
      // Toggle functionality
      const funcType = functionality as 'reminder' | 'tracker' | 'remindByCall';
      user.toggleFunctionality(funcType);

      // Save user/group with updated functionalities
      await this.registerUserUseCase.execute({
        userId: entityId,
        username: entityUsername,
        displayName: entityName,
        languageCode: user.language.code,
      });

      // Update the keyboard to show checkmarks
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
      const skipText = await this.translationService.translate(
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
