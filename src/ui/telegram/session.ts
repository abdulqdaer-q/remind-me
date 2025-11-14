import { Context, Middleware } from 'telegraf';
import { Update } from 'telegraf/types';

export interface SessionData {
    conversationState?: 'AWAITING_LANGUAGE' | 'AWAITING_LOCATION' | 'AWAITING_FUNCTIONALITIES';
    tempData?: {
        language?: string;
        location?: {
            latitude: number;
            longitude: number;
        };
    };
}

export interface BotContext extends Context<Update> {
    session?: SessionData;
    match?: RegExpExecArray;
}

// Simple in-memory session storage
const sessions = new Map<number, SessionData>();

export const sessionMiddleware: Middleware<BotContext> = (ctx, next) => {
    const chatId = ctx.chat?.id;
    if (chatId) {
        if (!sessions.has(chatId)) {
            sessions.set(chatId, {});
        }
        ctx.session = sessions.get(chatId);
    }
    return next();
};

export function clearSession(chatId: number) {
    sessions.delete(chatId);
}

export function getSession(chatId: number): SessionData | undefined {
    return sessions.get(chatId);
}

export function updateSession(chatId: number, data: Partial<SessionData>) {
    const current = sessions.get(chatId) || {};
    sessions.set(chatId, { ...current, ...data });
}
