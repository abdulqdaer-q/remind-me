import { Telegraf } from 'telegraf';
import { BotContext } from './Session';

/**
 * Notification Service
 * Handles sending notifications to users via Telegram
 */
export class NotificationService {
  constructor(private readonly bot: Telegraf<BotContext>) {}

  /**
   * Send a text message to a user
   */
  async sendMessage(userId: number, message: string): Promise<void> {
    try {
      await this.bot.telegram.sendMessage(userId, message);
    } catch (error) {
      console.error(`Failed to send message to user ${userId}:`, error);
    }
  }

  /**
   * Send a message with audio (for azan)
   */
  async sendAudio(userId: number, audioUrl: string, caption?: string): Promise<void> {
    try {
      await this.bot.telegram.sendAudio(userId, audioUrl, {
        caption,
      });
    } catch (error) {
      console.error(`Failed to send audio to user ${userId}:`, error);
    }
  }

  /**
   * Check if a chat is a group
   */
  async isGroup(chatId: number): Promise<boolean> {
    try {
      const chat = await this.bot.telegram.getChat(chatId);
      return chat.type === 'group' || chat.type === 'supergroup';
    } catch (error) {
      console.error(`Failed to check chat type for ${chatId}:`, error);
      return false;
    }
  }

  /**
   * Send a message with markdown formatting
   */
  async sendMarkdownMessage(userId: number, message: string): Promise<void> {
    try {
      await this.bot.telegram.sendMessage(userId, message, {
        parse_mode: 'Markdown',
      });
    } catch (error) {
      console.error(`Failed to send markdown message to user ${userId}:`, error);
    }
  }
}
