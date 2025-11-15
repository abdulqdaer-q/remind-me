import * as cron from 'node-cron';
import { UserRepository } from '../../domain/user/UserRepository';
import { PrayerTimesService } from '../../domain/prayer/PrayerTimesService';
import { TranslationService } from '../../infrastructure/i18n/TranslationService';
import { NotificationService } from '../../infrastructure/telegram/NotificationService';
import { DateTime } from '../../domain/shared/DateTime';
import { PrayerName, ALL_PRAYERS } from '../../domain/prayer/PrayerName';

/**
 * Reminder Scheduler
 * Manages scheduled prayer time reminders for subscribed users
 */
export class ReminderScheduler {
  private scheduledJobs: Map<string, cron.ScheduledTask> = new Map();

  constructor(
    private readonly userRepository: UserRepository,
    private readonly prayerTimesService: PrayerTimesService,
    private readonly translationService: TranslationService,
    private readonly notificationService: NotificationService
  ) {}

  /**
   * Start the scheduler
   * Runs every minute to check for prayer time reminders
   */
  start(): void {
    console.log('🕌 Starting prayer reminder scheduler...');

    // Run every minute
    const task = cron.schedule('* * * * *', async () => {
      await this.checkAndSendReminders();
    });

    this.scheduledJobs.set('main', task);
    console.log('✅ Prayer reminder scheduler started successfully!');
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    console.log('🛑 Stopping prayer reminder scheduler...');
    this.scheduledJobs.forEach((task) => task.stop());
    this.scheduledJobs.clear();
    console.log('✅ Prayer reminder scheduler stopped.');
  }

  /**
   * Check all users and send reminders if needed
   */
  private async checkAndSendReminders(): Promise<void> {
    try {
      // Get all subscribed users with reminder functionality enabled
      const users = await this.userRepository.findAllSubscribed();
      const subscribedUsers = users.filter(
        (user) => user.functionalities.reminder && user.location
      );

      const currentTime = DateTime.getCurrentTimeInMinutes();
      const currentDate = DateTime.today();

      for (const user of subscribedUsers) {
        if (!user.location) continue;

        try {
          // Get prayer times for user's location
          const prayerTimes = await this.prayerTimesService.getPrayerTimes(
            user.location,
            currentDate
          );

          // Check each prayer for reminders
          for (const prayer of prayerTimes.getAllPrayerTimes()) {
            const prayerTimeInMinutes = prayer.getTimeInMinutes();

            // 10 minutes before prayer
            if (this.shouldSendReminder(currentTime, prayerTimeInMinutes - 10)) {
              await this.send10MinuteBeforeReminder(
                user.id.value,
                prayer.name,
                user.language.code
              );
            }

            // At prayer time
            if (this.shouldSendReminder(currentTime, prayerTimeInMinutes)) {
              await this.sendPrayerTimeReminder(
                user.id.value,
                prayer.name,
                user.language.code
              );
            }

            // 5 minutes after prayer
            if (this.shouldSendReminder(currentTime, prayerTimeInMinutes + 5)) {
              await this.send5MinuteAfterReminder(
                user.id.value,
                prayer.name,
                user.language.code
              );
            }
          }
        } catch (error) {
          console.error(`Error processing reminders for user ${user.id.value}:`, error);
        }
      }
    } catch (error) {
      console.error('Error in reminder scheduler:', error);
    }
  }

  /**
   * Check if we should send a reminder at this time
   * Uses a 1-minute window to avoid missing reminders
   */
  private shouldSendReminder(currentTime: number, targetTime: number): boolean {
    // Send if within 1 minute of target time
    return Math.abs(currentTime - targetTime) < 1;
  }

  /**
   * Send 10-minute before prayer reminder
   */
  private async send10MinuteBeforeReminder(
    userId: number,
    prayer: PrayerName,
    languageCode: string
  ): Promise<void> {
    try {
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
      console.log(`✅ Sent 10-minute reminder for ${prayer} to user ${userId}`);
    } catch (error) {
      console.error(
        `Failed to send 10-minute reminder for ${prayer} to user ${userId}:`,
        error
      );
    }
  }

  /**
   * Send prayer time reminder
   */
  private async sendPrayerTimeReminder(
    userId: number,
    prayer: PrayerName,
    languageCode: string
  ): Promise<void> {
    try {
      let message: string;
      if (languageCode === 'ar') {
        message = `🕌 حان الآن وقت صلاة ${this.getPrayerNameInArabic(prayer)}!\n\nاللهم صلِّ على محمد وآل محمد`;
      } else {
        message = `🕌 It's time for ${prayer} prayer!\n\nMay Allah accept your prayer.`;
      }

      await this.notificationService.sendMessage(userId, message);

      // Check if it's a group and broadcast azan
      const isGroup = await this.notificationService.isGroup(userId);
      if (isGroup) {
        // TODO: Add azan audio URL here when available
        // const azanUrl = 'https://example.com/azan.ogg'; // Use .ogg or .mp3 format
        // const method = await this.notificationService.broadcastAzan(userId, azanUrl, `🕌 ${prayer} Azan`);
        // console.log(`📢 Broadcasted azan for ${prayer} via ${method} in group ${userId}`);
        console.log(`📢 Would broadcast azan for ${prayer} in group ${userId} (voice chat or voice message)`);
      }

      console.log(`✅ Sent prayer time reminder for ${prayer} to user ${userId}`);
    } catch (error) {
      console.error(
        `Failed to send prayer time reminder for ${prayer} to user ${userId}:`,
        error
      );
    }
  }

  /**
   * Send 5-minute after prayer reminder
   */
  private async send5MinuteAfterReminder(
    userId: number,
    prayer: PrayerName,
    languageCode: string
  ): Promise<void> {
    try {
      let message: string;
      if (languageCode === 'ar') {
        message = `🕌 مر ٥ دقائق على أذان ${this.getPrayerNameInArabic(prayer)}.\n\nتوجه إلى المسجد لأداء الصلاة إن أمكن!`;
      } else {
        message = `🕌 5 minutes have passed since ${prayer} prayer time.\n\nPlease go to the mosque to pray if possible!`;
      }

      await this.notificationService.sendMessage(userId, message);
      console.log(`✅ Sent 5-minute after reminder for ${prayer} to user ${userId}`);
    } catch (error) {
      console.error(
        `Failed to send 5-minute after reminder for ${prayer} to user ${userId}:`,
        error
      );
    }
  }

  /**
   * Get the previous prayer
   */
  private getPreviousPrayer(prayer: PrayerName): PrayerName | null {
    const index = ALL_PRAYERS.indexOf(prayer);
    if (index <= 0) {
      // For Fajr, previous prayer is Isha from previous day
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
