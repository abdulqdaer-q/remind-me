import { Markup } from 'telegraf';
import { Bot } from '../index';
import { BotContext } from '../session';
import { translate } from '../../../translations';
import { User, Functionalities } from '../../../core/models/User';
import fs from 'fs/promises';
import path from 'path';

const DB_PATH = path.join(__dirname, '../../../db.json');

async function loadDB(): Promise<{ [key: string]: User }> {
    try {
        const data = await fs.readFile(DB_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return {};
    }
}

async function saveDB(db: { [key: string]: User }) {
    await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
}

async function getOrCreateUser(userId: number, username?: string, displayName?: string): Promise<User> {
    const db = await loadDB();
    const userKey = userId.toString();

    if (!db[userKey]) {
        db[userKey] = new User({
            username: username || userId.toString(),
            displayName: displayName,
            isActive: true,
            preferences: {
                language: 'en',
                isSubscribed: false
            }
        });
        await saveDB(db);
    }

    return db[userKey];
}

async function updateUser(userId: number, updates: Partial<User>) {
    const db = await loadDB();
    const userKey = userId.toString();

    if (db[userKey]) {
        db[userKey] = { ...db[userKey], ...updates };
        await saveDB(db);
    }
}

export default function (bot: Bot) {
    // Handle /start command
    bot.command('start', async (ctx: BotContext) => {
        const userId = ctx.from?.id;
        if (!userId) return;

        // Create or get user
        await getOrCreateUser(userId, ctx.from?.username, ctx.from?.first_name);

        // Set conversation state
        if (ctx.session) {
            ctx.session.conversationState = 'AWAITING_LANGUAGE';
        }

        // Send welcome message with language selection
        const welcomeText = await translate('start-welcome');
        const chooseLanguageText = await translate('choose-language');

        await ctx.reply(
            `${welcomeText}\n\n${chooseLanguageText}`,
            Markup.inlineKeyboard([
                [
                    Markup.button.callback('🇬🇧 English', 'lang_en'),
                    Markup.button.callback('🇸🇦 العربية', 'lang_ar')
                ]
            ])
        );
    });

    // Handle language selection
    bot.action(/^lang_(.+)$/, async (ctx: BotContext) => {
        const userId = ctx.from?.id;
        if (!userId || !ctx.match) return;

        const language = ctx.match[1]; // 'en' or 'ar'

        // Save language to user preferences
        const db = await loadDB();
        const userKey = userId.toString();
        if (db[userKey]) {
            db[userKey].preferences.language = language;
            await saveDB(db);
        }

        // Store in session
        if (ctx.session) {
            ctx.session.tempData = { ...ctx.session.tempData, language };
            ctx.session.conversationState = 'AWAITING_LOCATION';
        }

        // Acknowledge language selection
        await ctx.answerCbQuery();
        await ctx.editMessageText(await translate('language-selected', language));

        // Request location
        const locationText = await translate('request-location', language);
        const buttonText = await translate('button-send-location', language);

        await ctx.reply(
            locationText,
            Markup.keyboard([
                [Markup.button.locationRequest(buttonText)]
            ]).resize()
        );
    });

    // Handle location sharing
    bot.on('location', async (ctx: BotContext) => {
        const userId = ctx.from?.id;
        if (!userId) return;

        // Check if we're expecting location
        if (ctx.session?.conversationState !== 'AWAITING_LOCATION') {
            return;
        }

        if (!ctx.message || !('location' in ctx.message)) {
            return;
        }

        const location = ctx.message.location;
        const db = await loadDB();
        const userKey = userId.toString();

        // Get user's language
        const userLanguage = db[userKey]?.preferences.language || 'en';

        // Save location to user
        if (db[userKey]) {
            db[userKey].location = {
                latitude: location.latitude,
                longitude: location.longitude
            };
            await saveDB(db);
        }

        // Update session
        if (ctx.session) {
            ctx.session.tempData = {
                ...ctx.session.tempData,
                location: {
                    latitude: location.latitude,
                    longitude: location.longitude
                }
            };
            ctx.session.conversationState = 'AWAITING_FUNCTIONALITIES';
        }

        // Acknowledge location save
        await ctx.reply(
            await translate('location-saved', userLanguage),
            Markup.removeKeyboard()
        );

        // Ask for functionality preferences
        const functionalitiesText = await translate('choose-functionalities', userLanguage);
        const reminderText = await translate('functionality-reminder', userLanguage);
        const trackerText = await translate('functionality-tracker', userLanguage);
        const remindByCallText = await translate('functionality-remind-by-call', userLanguage);
        const skipText = await translate('button-skip', userLanguage);

        await ctx.reply(
            functionalitiesText,
            Markup.inlineKeyboard([
                [Markup.button.callback(reminderText, 'func_reminder')],
                [Markup.button.callback(trackerText, 'func_tracker')],
                [Markup.button.callback(remindByCallText, 'func_remind_by_call')],
                [Markup.button.callback(`✅ ${skipText}`, 'func_done')]
            ])
        );
    });

    // Handle functionality selection
    bot.action(/^func_(.+)$/, async (ctx: BotContext) => {
        const userId = ctx.from?.id;
        if (!userId || !ctx.match) return;

        const functionality = ctx.match[1];
        const db = await loadDB();
        const userKey = userId.toString();
        const userLanguage = db[userKey]?.preferences.language || 'en';

        if (functionality === 'done') {
            // Complete setup
            if (ctx.session) {
                ctx.session.conversationState = undefined;
                ctx.session.tempData = undefined;
            }

            const hasSelections = db[userKey]?.functionalities && (
                db[userKey].functionalities!.reminder ||
                db[userKey].functionalities!.tracker ||
                db[userKey].functionalities!.remindByCall
            );

            const completeText = hasSelections
                ? await translate('setup-complete-with-selections', userLanguage)
                : await translate('setup-complete', userLanguage);

            await ctx.answerCbQuery();
            await ctx.editMessageText(completeText);
        } else {
            // Toggle functionality
            if (db[userKey]) {
                if (!db[userKey].functionalities) {
                    db[userKey].functionalities = {
                        reminder: false,
                        tracker: false,
                        remindByCall: false
                    };
                }

                const funcKey = functionality === 'reminder' ? 'reminder' :
                               functionality === 'tracker' ? 'tracker' :
                               'remindByCall';

                db[userKey].functionalities![funcKey] = !db[userKey].functionalities![funcKey];
                await saveDB(db);
            }

            // Update the keyboard to show checkmarks
            const reminderText = await translate('functionality-reminder', userLanguage);
            const trackerText = await translate('functionality-tracker', userLanguage);
            const remindByCallText = await translate('functionality-remind-by-call', userLanguage);
            const skipText = await translate('button-skip', userLanguage);

            const funcs = db[userKey]?.functionalities || { reminder: false, tracker: false, remindByCall: false };

            await ctx.answerCbQuery();
            await ctx.editMessageReplyMarkup({
                inline_keyboard: [
                    [Markup.button.callback(
                        `${funcs.reminder ? '✅ ' : ''}${reminderText}`,
                        'func_reminder'
                    )],
                    [Markup.button.callback(
                        `${funcs.tracker ? '✅ ' : ''}${trackerText}`,
                        'func_tracker'
                    )],
                    [Markup.button.callback(
                        `${funcs.remindByCall ? '✅ ' : ''}${remindByCallText}`,
                        'func_remind_by_call'
                    )],
                    [Markup.button.callback(`✅ ${skipText}`, 'func_done')]
                ]
            });
        }
    });
}
