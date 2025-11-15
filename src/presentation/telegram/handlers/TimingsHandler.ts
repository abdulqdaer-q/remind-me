import { Context, Markup } from 'telegraf';
import { GetPrayerTimesUseCase } from '../../../application/prayer/GetPrayerTimesUseCase';
import { RegisterUserUseCase } from '../../../application/user/RegisterUserUseCase';
import { PrayerTimesFormatter } from '../formatters/PrayerTimesFormatter';
import { Language } from '../../../domain/shared/Language';

/**
 * Timings Command Handler
 * Handles the /timings command to show prayer times
 */
export class TimingsHandler {
  constructor(
    private readonly getPrayerTimesUseCase: GetPrayerTimesUseCase,
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly formatter: PrayerTimesFormatter,
    private readonly webAppUrl: string
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

    // Check if user has location
    if (!user.hasLocation()) {
      await ctx.reply(
        'Please send your location first using /subscribe command.',
        Markup.removeKeyboard()
      );
      return;
    }
    // Generate mini app URL with user's location and language
    const miniAppUrl = this.formatter.generateMiniAppUrl(
      this.webAppUrl,
      user.location!.latitude,
      user.location!.longitude,
      user.language
    );
    await ctx.reply(
      '📱 Launch the prayer times app:',
      Markup.inlineKeyboard([Markup.button.webApp('🕌 Prayer Times', miniAppUrl)])
    );
  }
}
