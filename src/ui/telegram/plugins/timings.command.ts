import { Markup } from "telegraf";
import { Bot, bot } from "..";
import { prayerTimeService } from "../../../core/api/prayer-times";



export default (bot: Bot) => {
    const WEB_APP_URL = "https://cdpn.io/pen/debug/QWoNepM?authentication_hash=GnMnbWzGpxBM";

    bot.command('timings', async (ctx) => {
        await ctx.reply(
            "Launch mini app from inline keyboard!",
            Markup.inlineKeyboard([Markup.button.webApp("Launch", WEB_APP_URL)]),
        );
    })
}
