import { Markup } from 'telegraf';
import { BotContext } from '../../../infrastructure/telegram/Session';
import { Handler, Command, Action } from '../../../core/di/decorators';
import { TOKENS } from '../../../core/di/tokens';
import { BaseHandler } from '../../../core/handlers/BaseHandler';
import { NotificationService } from '../../../infrastructure/telegram/NotificationService';
import { PrayerName } from '../../../domain/prayer/PrayerName';

/**
 * Test Reminder Handler
 * Allows testing prayer reminders without waiting for actual prayer times
 *
 * Commands:
 * /test_reminder - Show test options
 */
@Handler(TOKENS.NotificationService)
export class TestReminderHandler extends BaseHandler {
  constructor(private readonly notificationService: NotificationService) {
    super();
  }

  /**
   * Handles the /test_reminder command
   */
  @Command('test_reminder')
  async handleTestReminder(ctx: BotContext): Promise<void> {
    const userId = ctx.from?.id;
    if (!userId) return;

    const chatId = ctx.chat?.id;
    if (!chatId) return;

    // Check if this is a group or private chat
    const isGroup = await this.notificationService.isGroup(chatId);
    const chatType = isGroup ? 'group' : 'private';

    await ctx.reply(
      `🧪 *Reminder Test Menu*\n\n` +
        `Chat Type: ${chatType}\n` +
        `Chat ID: ${chatId}\n\n` +
        `Choose a reminder type to test:`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('⏰ 10 Min Before (Fajr)', 'test_before_Fajr')],
          [Markup.button.callback('🕌 Prayer Time (Dhuhr)', 'test_time_Dhuhr')],
          [Markup.button.callback('📍 5 Min After (Asr)', 'test_after_Asr')],
          [Markup.button.callback('🎵 Test Azan Broadcast', 'test_azan')],
        ]),
      }
    );
  }

  /**
   * Handle 10 minutes before reminder test
   */
  @Action(/^test_before_(.+)$/)
  async handleTestBefore(ctx: BotContext): Promise<void> {
    if (!ctx.match) return;

    const prayer = ctx.match[1] as PrayerName;
    const chatId = ctx.chat?.id;
    if (!chatId) return;

    // Get language from user (default to English for testing)
    const languageCode = ctx.from?.language_code === 'ar' ? 'ar' : 'en';

    await this.send10MinuteBeforeReminder(chatId, prayer, languageCode);

    await ctx.answerCbQuery('✅ Sent 10-minute before reminder');
  }

  /**
   * Handle prayer time reminder test
   */
  @Action(/^test_time_(.+)$/)
  async handleTestTime(ctx: BotContext): Promise<void> {
    if (!ctx.match) return;

    const prayer = ctx.match[1] as PrayerName;
    const chatId = ctx.chat?.id;
    if (!chatId) return;

    const languageCode = ctx.from?.language_code === 'ar' ? 'ar' : 'en';

    await this.sendPrayerTimeReminder(chatId, prayer, languageCode);

    await ctx.answerCbQuery('✅ Sent prayer time reminder');
  }

  /**
   * Handle 5 minutes after reminder test
   */
  @Action(/^test_after_(.+)$/)
  async handleTestAfter(ctx: BotContext): Promise<void> {
    if (!ctx.match) return;

    const prayer = ctx.match[1] as PrayerName;
    const chatId = ctx.chat?.id;
    if (!chatId) return;

    const languageCode = ctx.from?.language_code === 'ar' ? 'ar' : 'en';

    await this.send5MinuteAfterReminder(chatId, prayer, languageCode);

    await ctx.answerCbQuery('✅ Sent 5-minute after reminder');
  }

  /**
   * Handle azan broadcast test
   */
  @Action('test_azan')
  async handleTestAzan(ctx: BotContext): Promise<void> {
    const chatId = ctx.chat?.id;
    if (!chatId) return;

    const isGroup = await this.notificationService.isGroup(chatId);

    if (!isGroup) {
      await ctx.answerCbQuery('❌ Azan broadcast only works in groups');
      await ctx.reply('⚠️ Azan broadcast is only available in group chats.');
      return;
    }

    await ctx.answerCbQuery('🎵 Testing azan broadcast...');

    // Test with a placeholder URL (you can replace with actual azan URL)
    const testAzanUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

    try {
      const method = await this.notificationService.broadcastAzan(
        chatId,
        testAzanUrl,
        '🕌 Test Azan'
      );

      let message = '';
      if (method === 'voice_chat') {
        message = '✅ Azan broadcasted via *voice chat streaming*!';
      } else if (method === 'voice_message') {
        message = '✅ Azan sent as *voice message*!\n\n' +
          'ℹ️ Voice chat streaming is not configured. ' +
          'See VOICE_CHAT_SETUP.md for setup instructions.';
      } else {
        message = '❌ Failed to broadcast azan. Check logs for details.';
      }

      await ctx.reply(message, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Test azan broadcast error:', error);
      await ctx.reply('❌ Error broadcasting azan. Check bot logs.');
    }
  }

  /**
   * Send 10-minute before prayer reminder (copied from ReminderScheduler)
   */
  private async send10MinuteBeforeReminder(
    userId: number,
    prayer: PrayerName,
    languageCode: string
  ): Promise<void> {
    const previousPrayer = this.getPreviousPrayer(prayer);

    let message: string;
    if (languageCode === 'ar') {
      message = `⏰ تنبيه: صلاة ${this.getPrayerNameInArabic(prayer)} ستبدأ بعد ١٠ دقائق.\n`;
      if (previousPrayer) {
        message += `إذا لم تصلِ ${this.getPrayerNameInArabic(previousPrayer)} بعد، صلِّها الآن!`;
      }
    } else {
      message = `⏰ Reminder: ${prayer} prayer will start in 10 minutes.\n`;
      if (previousPrayer) {
        message += `If you haven't prayed ${previousPrayer} yet, please pray it now!`;
      }
    }

    await this.notificationService.sendMessage(userId, message);
  }

  /**
   * Send prayer time reminder (copied from ReminderScheduler)
   */
  private async sendPrayerTimeReminder(
    userId: number,
    prayer: PrayerName,
    languageCode: string
  ): Promise<void> {
    let message: string;
    if (languageCode === 'ar') {
      message = `🕌 حان الآن وقت صلاة ${this.getPrayerNameInArabic(prayer)}!\n\nاللهم صلِّ على محمد وآل محمد`;
    } else {
      message = `🕌 It's time for ${prayer} prayer!\n\nMay Allah accept your prayer.`;
    }

    await this.notificationService.sendMessage(userId, message);

    // Check if it's a group and show note about azan
    const isGroup = await this.notificationService.isGroup(userId);
    if (isGroup) {
      await this.notificationService.sendMessage(
        userId,
        '📢 (In production, azan would be broadcasted here. Use /test_reminder → Test Azan to try it.)'
      );
    }
  }

  /**
   * Send 5-minute after prayer reminder (copied from ReminderScheduler)
   */
  private async send5MinuteAfterReminder(
    userId: number,
    prayer: PrayerName,
    languageCode: string
  ): Promise<void> {
    let message: string;
    if (languageCode === 'ar') {
      message = `🕌 مر ٥ دقائق على أذان ${this.getPrayerNameInArabic(prayer)}.\n\nتوجه إلى المسجد لأداء الصلاة إن أمكن!`;
    } else {
      message = `🕌 5 minutes have passed since ${prayer} prayer time.\n\nPlease go to the mosque to pray if possible!`;
    }

    await this.notificationService.sendMessage(userId, message);
  }

  /**
   * Get the previous prayer
   */
  private getPreviousPrayer(prayer: PrayerName): PrayerName | null {
    const ALL_PRAYERS = [
      PrayerName.FAJR,
      PrayerName.DHUHR,
      PrayerName.ASR,
      PrayerName.MAGHRIB,
      PrayerName.ISHA,
    ];

    const index = ALL_PRAYERS.indexOf(prayer);
    if (index <= 0) {
      return PrayerName.ISHA;
    }
    return ALL_PRAYERS[index - 1];
  }

  /**
   * Get prayer name in Arabic
   */
  private getPrayerNameInArabic(prayer: PrayerName): string {
    const arabicNames: Record<PrayerName, string> = {
      [PrayerName.FAJR]: 'الفجر',
      [PrayerName.DHUHR]: 'الظهر',
      [PrayerName.ASR]: 'العصر',
      [PrayerName.MAGHRIB]: 'المغرب',
      [PrayerName.ISHA]: 'العشاء',
    };
    return arabicNames[prayer];
  }
}
