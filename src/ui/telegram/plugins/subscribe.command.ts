
import { Markup } from "telegraf";
import { Bot } from "..";
import { translate } from "../../../translations";

export default (bot: Bot) => {
    bot.command('subscribe', async (ctx) => {
        console.log({
            ctx: ctx.message
        });
        const message = await translate('welcome-please-send-your-location', 'en')
        ctx.reply(message,Markup.keyboard([
			Markup.button.locationRequest("Send location"),
		]).resize().oneTime(),)
    });
}
