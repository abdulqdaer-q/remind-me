import { Context, Middleware } from 'telegraf';
import { Update } from 'telegraf/types';

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
 * Simple in-memory session storage for conversation state
 */
export class SessionManager {
  private sessions = new Map<number, SessionData>();

  getSession(chatId: number): SessionData {
    if (!this.sessions.has(chatId)) {
      this.sessions.set(chatId, {});
    }
    return this.sessions.get(chatId)!;
  }

  updateSession(chatId: number, data: Partial<SessionData>): void {
    const current = this.getSession(chatId);
    this.sessions.set(chatId, { ...current, ...data });
  }

  clearSession(chatId: number): void {
    this.sessions.delete(chatId);
  }

  createMiddleware(): Middleware<BotContext> {
    return (ctx, next) => {
      const chatId = ctx.chat?.id;
      if (chatId) {
        ctx.session = this.getSession(chatId);
      }
      return next();
    };
  }
}
