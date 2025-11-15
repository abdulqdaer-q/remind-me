import { Context, Middleware } from 'telegraf';
import { Update } from 'telegraf/types';
import Redis from 'ioredis';

/**
 * Session Data
 * Stores conversation state and temporary data for the onboarding flow
 */
export interface SessionData {
  conversationState?:
    | 'AWAITING_LANGUAGE'
    | 'AWAITING_LOCATION'
    | 'AWAITING_FUNCTIONALITIES';
  tempData?: {
    language?: string;
    location?: {
      latitude: number;
      longitude: number;
    };
  };
}

/**
 * Bot Context with Session
 * Extends Telegraf Context with session support
 */
export interface BotContext extends Context<Update> {
  session?: SessionData;
  match?: RegExpExecArray;
}

/**
 * Session Manager
 * Redis-backed session storage for conversation state
 * Provides persistence and scalability for session data
 */
export class SessionManager {
  private redis: Redis;
  private readonly SESSION_TTL = 86400; // 24 hours in seconds
  private readonly SESSION_PREFIX = 'session:';

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl, {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    this.redis.on('error', (err) => {
      console.error('Redis connection error:', err);
    });

    this.redis.on('connect', () => {
      console.log('✓ Redis connected successfully');
    });
  }

  private getKey(chatId: number): string {
    return `${this.SESSION_PREFIX}${chatId}`;
  }

  async getSession(chatId: number): Promise<SessionData> {
    try {
      const key = this.getKey(chatId);
      const data = await this.redis.get(key);

      if (!data) {
        return {};
      }

      return JSON.parse(data);
    } catch (error) {
      console.error('Error getting session:', error);
      return {};
    }
  }

  async updateSession(chatId: number, data: Partial<SessionData>): Promise<void> {
    try {
      const key = this.getKey(chatId);
      const current = await this.getSession(chatId);
      const updated = { ...current, ...data };

      await this.redis.setex(key, this.SESSION_TTL, JSON.stringify(updated));
    } catch (error) {
      console.error('Error updating session:', error);
    }
  }

  async clearSession(chatId: number): Promise<void> {
    try {
      const key = this.getKey(chatId);
      await this.redis.del(key);
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  }

  createMiddleware(): Middleware<BotContext> {
    return async (ctx, next) => {
      const chatId = ctx.chat?.id;
      if (chatId) {
        ctx.session = await this.getSession(chatId);
      }
      return next();
    };
  }

  /**
   * Gracefully close Redis connection
   */
  async disconnect(): Promise<void> {
    await this.redis.quit();
  }
}
