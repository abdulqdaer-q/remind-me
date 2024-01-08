
import { Markup } from "telegraf";
import { Bot } from "..";
import { translate } from "../../../translations";

export default (bot: Bot) => {
    bot.on('location', async (ctx) => {
        console.log({
            ctx: ctx.message
        });
        
    });
}
