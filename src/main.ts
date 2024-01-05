/* eslint-disable max-len */
import * as dotenv from 'dotenv';
dotenv.config();
import TelegramBot from 'node-telegram-bot-api';
import { setBotCommands } from './setBotCommands';
import {postStoryToInsta, postToInsta, postVideoToInsta } from './functions';
import { main } from './linkedintest';

if (!process.env.TELEGRAM_BOT_API_KEY) {
    console.error('Please provide your bot\'s API key on the .env file.');
    process.exit();
}
const token = process.env.TELEGRAM_BOT_API_KEY;
export const bot = new TelegramBot(token, { polling: true });
// const botUsername = (await bot.getMe()).username;
let waitForPhoto = false
let waitForStory = false
let waitForVideo = false

setBotCommands(bot);
// Messages for conversations.
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
  
    
});

bot.onText(/^\/(\w+)(@\w+)?(?:\s.\*)?/, async (msg, match) => {
    if (!match) return;
    let command: string | undefined;

    if (match.input.split(' ').length != 1) {
        command = match.input.split(' ').shift();
    } else {
        const chatId = msg.chat.id.toString();
    
        command = match.input;
        if (
            !(
                command.startsWith('/start') ||
        command.startsWith('/help') ||
        command.startsWith('/post') ||
        command.startsWith('/story') ||
        command.startsWith('/video') 
            )
        ) {
            await bot.sendMessage(
                msg.chat.id,
               'Please use the /start command to start the bot.',
                { reply_to_message_id: msg.message_id }
            );
            return;
        }
    }
    const chatId = msg.chat.id.toString();

    switch (command) {
    case '/start':
        (async () => {
            const getCommands = await bot.getMyCommands();
            const commands = getCommands.map((command) => {
                return `/${command.command} - ${command.description}`;
            });
            await bot.sendMessage(
                msg.chat.id,
                `Hello, ${msg.from?.first_name}!\nThis bot is made by Eric Strohmaier.\nHere are the commands you can use:\n${commands.join('\n')}`,
                { reply_to_message_id: msg.message_id }
                );
    })
    ();
    break;
    case '/help':
        (async () => {
            const getCommands = await bot.getMyCommands();
            const commands = getCommands.map((command) => {
                return `/${command.command} - ${command.description}`;
            });
            await bot.sendMessage(
                msg.chat.id,
                `Here are the commands you can use:\n${commands.join('\n')}`,
                { reply_to_message_id: msg.message_id }
            );
    })();
    break;
    case '/post':
        (async () => {
            await bot.sendMessage(chatId, 'Please send me now a picture with an optimal caption', { reply_to_message_id: msg.message_id });
            waitForPhoto = true
        })();
        break;
        case '/story':
            (async () => {
                await bot.sendMessage(chatId, 'Please send me now a picture for the story', { reply_to_message_id: msg.message_id });
                waitForStory = true
            })();
        break;
    case '/video':
        (async () => {
            await bot.sendMessage(chatId, 'Please send me now a video with an optimal caption', { reply_to_message_id: msg.message_id });
            waitForVideo = true
        })();
    default:
        break;
    }
});

bot.on('photo', async (msg) => {
    if (waitForPhoto){
    waitForPhoto = false
    const chatId = msg.chat.id;
    const caption = msg.caption || '';
    const fileId = msg.photo![msg.photo!.length - 1].file_id;
    const file = await bot.getFile(fileId);
    const imageUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
    console.log('imageUrl', imageUrl);
    const res = await postToInsta(imageUrl, caption);
    if (res.success) {
        await bot.sendMessage(chatId, 'Your post has been published on Instagram!', { reply_to_message_id: msg.message_id });
    } else {
        await bot.sendMessage(chatId, 'Something went wrong. Please try again later.', { reply_to_message_id: msg.message_id });
    }}
    if (waitForStory){
        waitForStory = false
        const chatId = msg.chat.id;
        const fileId = msg.photo![msg.photo!.length - 1].file_id;
        const file = await bot.getFile(fileId);
        const imageUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
        console.log('imageUrl', imageUrl);
        const res = await postStoryToInsta(imageUrl);
        if (res.success) {
            await bot.sendMessage(chatId, 'Your story has been published on Instagram!', { reply_to_message_id: msg.message_id });
        } else {
            await bot.sendMessage(chatId, 'Something went wrong. Please try again later.', { reply_to_message_id: msg.message_id });
        }
    }
    

});

bot.on('video', async (msg) => {
    if (waitForVideo) {
      waitForVideo = false;
  
      const chatId = msg.chat.id;
      const caption = msg.caption || '';
      const fileId = msg.video!.file_id;
      const file = await bot.getFile(fileId);
      const videoUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
      
      console.log('videoUrl', videoUrl);
      
      const res = await postVideoToInsta(videoUrl, caption);
      
      if (res.success) {
        await bot.sendMessage(chatId, 'Your video has been published on Instagram!', { reply_to_message_id: msg.message_id });
      } else {
        await bot.sendMessage(chatId, 'Something went wrong. Please try again later.', { reply_to_message_id: msg.message_id });
      }
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
