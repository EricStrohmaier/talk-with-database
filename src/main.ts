/* eslint-disable max-len */
import * as dotenv from 'dotenv';
dotenv.config();
import TelegramBot from 'node-telegram-bot-api';
import { setBotCommands } from './setBotCommands';
import { getTablesAndColumns } from './functions';

if (!process.env.TELEGRAM_BOT_API_KEY) {
    console.error('Please provide your bot\'s API key on the .env file.');
    process.exit();
}
const token = process.env.TELEGRAM_BOT_API_KEY;
export const bot = new TelegramBot(token, { polling: true });
// const botUsername = (await bot.getMe()).username;

setBotCommands(bot);
// Messages for conversations.
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
  
    getTablesAndColumns();
});

bot.onText(/^\/(\w+)(@\w+)?(?:\s.\*)?/, async (msg, match) => {
    if (!match) return;
    let command: string | undefined; 
    switch (command) {
    case '/start':
        (async () => {
            bot.sendMessage(msg.chat.id, 'Okay my mission is to have a interface where i can talk with my database without of the ai knowing whats inside .... but just using basic SQL.');
        })();
        break;
    case '/help':
        (async () => {
            const getCommands = await bot.getMyCommands();
            const commands = getCommands.map((command) => {
                return `/${command.command} - ${command.description}`;
            });
            await bot.sendMessage(msg.chat.id, commands.join('\n'));
        })();
        break;
    case '/text':
        (async () => {
            bot.sendMessage(msg.chat.id, 'Okay now just write me what you need to know! ');
        })();
        break;
    case '/database'
        :
        (async () => {
            bot.sendMessage(msg.chat.id, 'Okay now just write me what you need to know! ');
        })();
        break;
    default:
        break;
    }
});



console.log('Bot Started!');

process.on('SIGINT', () => {
    console.log('\nExiting...');
    bot.stopPolling();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\nExiting...');
    bot.stopPolling();
    process.exit(0);
});
//on error restart bot
// process.on('uncaughtException', function (err) {
//     console.log('SYSTEM: uncaughtExpection', err);
//     bot.stopPolling();
//     setTimeout(() => {
//         bot.startPolling();
//     }, 5000);
// });
