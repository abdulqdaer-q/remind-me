/**
 * Base Handler Class
 * Provides common functionality for all handlers
 */

import { Context } from 'telegraf';
import { Update } from 'telegraf/typings/core/types/typegram';

export abstract class BaseHandler {
  /**
   * Handle errors in a consistent way
   */
  protected async handleError(ctx: Context, error: Error, customMessage?: string): Promise<void> {
    console.error(`[${this.constructor.name}] Error:`, error);

    try {
      const message = customMessage || 'An error occurred. Please try again later.';
      await ctx.reply(message);
    } catch (replyError) {
      console.error(`[${this.constructor.name}] Failed to send error message:`, replyError);
    }
  }

  /**
   * Safe reply with error handling
   */
  protected async safeReply(ctx: Context, message: string, extra?: any): Promise<void> {
    try {
      await ctx.reply(message, extra);
    } catch (error) {
      console.error(`[${this.constructor.name}] Failed to send reply:`, error);
    }
  }

  /**
   * Safe answer callback query
   */
  protected async safeAnswerCallbackQuery(ctx: Context, text?: string): Promise<void> {
    try {
      if ('answerCbQuery' in ctx) {
        await (ctx as any).answerCbQuery(text);
      }
    } catch (error) {
      console.error(`[${this.constructor.name}] Failed to answer callback query:`, error);
    }
  }

  /**
   * Get user ID from context
   */
  protected getUserId(ctx: Context): number {
    return ctx.from?.id || 0;
  }

  /**
   * Get chat ID from context
   */
  protected getChatId(ctx: Context): number {
    return ctx.chat?.id || 0;
  }

  /**
   * Check if context has a specific property
   */
  protected hasProperty<K extends keyof Context>(
    ctx: Context,
    property: K
  ): ctx is Context & Record<K, NonNullable<Context[K]>> {
    return property in ctx && ctx[property] !== undefined;
  }

  /**
   * Validate required context properties
   */
  protected validateContext(ctx: Context, requiredProps: (keyof Context)[]): boolean {
    return requiredProps.every((prop) => this.hasProperty(ctx, prop));
  }
}
