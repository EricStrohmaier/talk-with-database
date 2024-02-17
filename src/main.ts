/* eslint-disable max-len */
import * as dotenv from 'dotenv';
dotenv.config();
import TelegramBot from 'node-telegram-bot-api';
import { setBotCommands } from './setBotCommands';
import { getPostFeed, postStoryToInsta, postToInsta, postVideoToInsta } from './functions';
import { postInstagramPost, postInstagramStory, postInstagramVideo } from './instaRoutes';

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
    const chatId = msg.chat.id.toString();

    if (chatId !== '5058142202') {
        await bot.sendMessage(
            msg.chat.id,
            'Sorry this bot is only for @ericstrohmaier pls contact him to get your own instagram posting bot', { reply_to_message_id: msg.message_id }
        );
        return;
    }
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
                'Please use the /help command to get a list of all valid commands.',
                { reply_to_message_id: msg.message_id }
            );
            return;
        }
    }

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
                );
            })();
            break;
        case '/post':
            (async () => {
                await bot.sendMessage(chatId, 'Please send me now a picture with an optimal caption');
                waitForPhoto = true
            })();
            break;
        case '/story':
            (async () => {
                await bot.sendMessage(chatId, 'Please send me now a picture or video for the story');
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
    if (waitForPhoto) {
        waitForPhoto = false
        const chatId = msg.chat.id;
        const caption = msg.caption || '';
        const fileId = msg.photo![msg.photo!.length - 1].file_id;
        const file = await bot.getFile(fileId);
        const imageUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
        console.log('imageUrl', imageUrl);
        const res = await postInstagramPost(imageUrl, caption, process.env.IG_USERNAME!, process.env.IG_PASSWORD!);
        if (res) {
            await bot.sendMessage(chatId, "Posted successfully", { reply_to_message_id: msg.message_id });
        } else {
            await bot.sendMessage(chatId, 'Something went wrong. Please try again later.', { reply_to_message_id: msg.message_id });
        }
    }
    if (waitForStory) {
        waitForStory = false
        const chatId = msg.chat.id;
        const fileId = msg.photo![msg.photo!.length - 1].file_id;
        const file = await bot.getFile(fileId);
        const imageUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
        console.log('imageUrl', imageUrl);

        const res = await postInstagramStory(imageUrl, process.env.IG_USERNAME!, process.env.IG_PASSWORD!, false);
        console.log(res);
        
        if (res) {
            await bot.sendMessage(chatId, "Posted successfully", { reply_to_message_id: msg.message_id });
        } else {
            await bot.sendMessage(chatId, 'Something went wrong. Please try again later.', { reply_to_message_id: msg.message_id });
        }
    }


});

bot.on('video', async (msg) => {

    if (waitForStory) {
        waitForStory = false
        const chatId = msg.chat.id;
        const fileId = msg.photo![msg.photo!.length - 1].file_id;
        const file = await bot.getFile(fileId);
        const imageUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
        console.log('imageUrl', imageUrl);

        const res = await postInstagramStory(imageUrl, process.env.IG_USERNAME!, process.env.IG_PASSWORD!, true);
        if (res) {
            await bot.sendMessage(chatId, "Posted successfully", { reply_to_message_id: msg.message_id });
        } else {
            await bot.sendMessage(chatId, 'Something went wrong. Please try again later.', { reply_to_message_id: msg.message_id });
        }
    }
    if (waitForVideo) {
        waitForVideo = false;

        const chatId = msg.chat.id;
        const caption = msg.caption || '';
        const fileId = msg.video!.file_id;
        const file = await bot.getFile(fileId);
        const videoUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;

        console.log('videoUrl', videoUrl);

        const res = await postInstagramVideo(videoUrl,  process.env.IG_USERNAME!, process.env.IG_PASSWORD!, caption);

        if (res) {
            await bot.sendMessage(chatId, 'Your video has been published on Instagram!', { reply_to_message_id: msg.message_id });
        } else {
            await bot.sendMessage(chatId, 'Something went wrong. Please try again later.', { reply_to_message_id: msg.message_id });
        }
    }
});



console.log('Bot Started!');
// getPostFeed()
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
