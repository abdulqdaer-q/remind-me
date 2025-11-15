import { Telegraf } from 'telegraf';
import { BotContext } from './Session';
import { VoiceChatService } from './VoiceChatService';

/**
 * Notification Service
 * Handles sending notifications to users via Telegram
 */
export class NotificationService {
  constructor(
    private readonly bot: Telegraf<BotContext>,
    private readonly voiceChatService?: VoiceChatService
  ) {}

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
   * Broadcast voice message (for azan in groups)
   * Sends as a voice message (circular audio) instead of regular audio file
   */
  async broadcastVoice(chatId: number, voiceUrl: string, caption?: string): Promise<void> {
    try {
      await this.bot.telegram.sendVoice(chatId, voiceUrl, {
        caption,
      });
    } catch (error) {
      console.error(`Failed to broadcast voice to chat ${chatId}:`, error);
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

  /**
   * Broadcast azan in voice chat (if available) or as voice message (fallback)
   *
   * @param chatId - The chat ID
   * @param azanAudioPath - Path to azan audio file (URL or local path)
   * @param caption - Optional caption for the azan
   * @returns Promise<'voice_chat' | 'voice_message' | 'failed'> - Broadcast method used
   */
  async broadcastAzan(
    chatId: number,
    azanAudioPath: string,
    caption?: string
  ): Promise<'voice_chat' | 'voice_message' | 'failed'> {
    // Try voice chat streaming first (if service is available)
    if (this.voiceChatService?.isAvailable()) {
      console.log(`🎵 Attempting to broadcast azan via voice chat in ${chatId}`);
      const streamed = await this.voiceChatService.streamAudio(chatId, azanAudioPath);

      if (streamed) {
        console.log(`✅ Successfully broadcasted azan via voice chat in ${chatId}`);
        return 'voice_chat';
      }

      console.log(`⚠️  Voice chat streaming failed, falling back to voice message`);
    }

    // Fallback to voice message
    try {
      await this.broadcastVoice(chatId, azanAudioPath, caption);
      console.log(`✅ Sent azan as voice message to ${chatId}`);
      return 'voice_message';
    } catch (error) {
      console.error(`Failed to broadcast azan to ${chatId}:`, error);
      return 'failed';
    }
  }
}
