/* eslint-disable max-len */
import * as dotenv from 'dotenv';
dotenv.config();
import TelegramBot from 'node-telegram-bot-api';
import {
    createUserEntry,
    deleteJobAlerts,
    formatVariables,
    getKeyword,
    getLatestJobs,
    getUserConfigs,
    hasJobAlert,
    readUserEntry,
    sendParseMessage,
    updateJobAlerts,
} from './functions';
import { PARAMETERS } from './parameters';
import { TRANSLATIONS } from './translation';
import { setBotCommands } from './setBotCommands';

if (!process.env.TELEGRAM_BOT_API_KEY) {
    console.error('Please provide your bot\'s API key on the .env file.');
    process.exit();
} else if (!process.env.OPENAI_API_KEY) {
    console.error('Please provide your openAI API key on the .env file.');
    process.exit();
}
const token = process.env.TELEGRAM_BOT_API_KEY;
const bot = new TelegramBot(token, { polling: true });
const botUsername = (await bot.getMe()).username;

// export let userConfig: { chatId: string;  language: string };
// if (fs.existsSync('./user-config.json')) {
//     userConfig = JSON.parse(fs.readFileSync('./user-config.json').toString());
// } else {
//     userConfig = {
//         chatId: '',
//         language: '',
//     };
// }

setBotCommands(bot);
let waitingForKeywords = false;
let setJobAlert = false;

// Messages for conversations.
bot.on('message', async (msg) => {
    for (const command of await bot.getMyCommands()) {
        if (msg.text?.startsWith('/' + command.command)) {
            return;
        }
    }
    const newChat = await readUserEntry(msg.chat.id.toString());
    if (!newChat) {
        createUserEntry(msg.chat.id.toString());
    }
    if (setJobAlert && msg.text) {
        const chatId = msg.chat.id;
        const newKeywords = msg.text.split(',');

        // Remove duplicates and empty strings
        const uniqueNewKeywords = newKeywords
            .map((keyword) => keyword.trim())
            .filter((keyword) => keyword !== '');

        const response = await updateJobAlerts(
            chatId.toString(),
            uniqueNewKeywords
        );
        if (response) {
            await bot.sendMessage(chatId, 'Job alert updated!');
        } else {
            await bot.sendMessage(chatId, 'Something went wrong. Please try again.');
        }
        setJobAlert = false;
    }

    if (waitingForKeywords) {
        const chatId = msg.chat.id;
        waitingForKeywords = false;

        const keywords = msg.text?.split(',') || [];
        const response = await getKeyword(keywords);
        if (response && response?.length > 0) {
            await sendParseMessage(chatId, response, bot, [
                'with ' + keywords.join(', '),
            ]);
            return;
        } else {
            await bot.sendMessage(chatId, 'No jobs found for the keywords provided.');
            return;
        }
    }
});

bot.onText(/^\/(\w+)(@\w+)?(?:\s.\*)?/, async (msg, match) => {
    if (!match) return;
    let command: string | undefined;

    if (match.input.split(' ').length != 1) {
        command = match.input.split(' ').shift();
    } else {
        const chatId = msg.chat.id.toString();
        const userConfigs = getUserConfigs();
        const userLanguage = userConfigs[chatId]?.language || PARAMETERS.LANGUAGE;
        const newChat = await readUserEntry(chatId);
        if (!newChat) {
            createUserEntry(chatId);
        }
        command = match.input;
        if (
            !(
                command.startsWith('/start') ||
        command.startsWith('/value4value') ||
        command.startsWith('/jobs') ||
        command.startsWith('/jobalert') ||
        command.startsWith('/privacy') ||
        command.startsWith('/help') ||
        command.startsWith('/freeguide')
            )
        ) {
            await bot.sendMessage(
                msg.chat.id,
                formatVariables(TRANSLATIONS[userLanguage].errors['generic-error'], {
                    command,
                }),
                { reply_to_message_id: msg.message_id }
            );
            return;
        }
    }

    if (command?.endsWith('@' + botUsername)) {
        command = command.replace('@' + botUsername, '');
    } else if (msg.chat.type != 'private') {
        return;
    }
    const chatId = msg.chat.id.toString();
    const userConfigs = getUserConfigs();
    const userLanguage = userConfigs[chatId]?.language || PARAMETERS.LANGUAGE;

    switch (command) {
    case '/start':
        (async () => {
            const getCommands = await bot.getMyCommands();
            const commands = getCommands.map((command) => {
                return `/${command.command} - ${command.description}`;
            });
            const startMessage =
          'Hey there, I’m your friendly Bitvocation bot! 👋\n\nI scrape the internet for all the latest job openings in Bitcoin and post them in the @bitvocationfeed.\n\nI was thought up <a href="https://twitter.com/connecteconomy"><b>by Anja</b></a> and created <a href="https://njump.me/strohstacks@getalby.com"><b>by Eric</b></a>';

            const boldHeader =
          '<b>Here are the commands you can use to work with me: \n</b>';
            const commandsMessage = boldHeader + commands.join('\n');

            const combinedMessage =
          startMessage +
          '\n\n' +
          commandsMessage +
          '\n\n' +
          'Before we chat, I want you to be aware of what data I use from you. Please click on /privacy now to to learn more about it.';
            const imageFilePath = './public/bot-img.jpg';
            await bot.sendPhoto(msg.chat.id, imageFilePath, {
                caption: combinedMessage,
                parse_mode: 'HTML',
                
            });
        })();
        break;

    case '/value4value':
        (async () => {
            const keyboard = {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: 'Zap sats ⚡',
                                url: 'https://getalby.com/p/strohstacks',
                            },
                        ],
                    ],
                },
            };
            await bot.sendMessage(
                msg.chat.id,
                TRANSLATIONS[userLanguage].general.donate,
                keyboard
            );
        })();

        break;
    case '/jobs':
        if (msg.chat.id) {
            const chatId = msg.chat.id.toString();
            //check how it where it presses explore categories
            const keyboard = {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: 'All the Jobs of the last 7 days',
                                callback_data: 'last-week',
                            },
                        ],
                        [
                            {
                                text: 'Search the last 30 days by keyword',
                                callback_data: 'query-keyword',
                            },
                        ],

                        [
                            {
                                text: 'Explore Categories',
                                callback_data: 'explore-categories',
                            },
                        ],
                    ],
                },
            };
            await bot.sendMessage(
                chatId,
                TRANSLATIONS[userLanguage].general['latest-jobs'],
                keyboard
            );
        }
        break;
    case '/jobalert':
        (async () => {
            const chatId = msg.chat.id.toString();
            const response = await hasJobAlert(chatId);
            const messageSetup = 'To set up a job alert, enter keywords separated by commas.\n\nFor example:  Remote, Customer Support, Pay in Bitcoin';
            const messageUpdate = 'Simply add keywords, separated by commas, to receive job alerts.\n ';
            const keyboard = {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: 'See current Alert', callback_data: 'current-alerts' },
                            { text: 'Delete Job Alert', callback_data: 'delete-alerts' },
                        ],
                    ],
                },
            };
            const sendKeyboard = response.length > 0 ?  keyboard : undefined;
            const sendMessage = response.length > 0 ? messageUpdate : messageSetup;
           
            await bot.sendMessage(chatId, sendMessage, sendKeyboard);
            setJobAlert = true;
        })();
        break;
    case '/help':
        (async () => {
            const getCommands = await bot.getMyCommands();
            const commands = getCommands.map((command) => {
                return `/${command.command} - ${command.description}`;
            });
            const header = TRANSLATIONS[userLanguage].general['help'];

            const commandsMessage = header + commands.join('\n');
            await bot.sendMessage(msg.chat.id, commandsMessage);
        })();
        break;
    case '/freeguide':
        (async () => {
            const keyboard = {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: 'Download it here',
                                url: 'https://bitvocation.com',
                            },
                        ],
                    ],
                },
            };
            const message =
          'Hey there, I’m Anja, the founder of Bitvocation.\n\nI made a free guide “How to find your first job in Bitcoin” for you, which you can get on the Bitvocation website.\nEnjoy!';
            const anjaIMG = './public/anja-img.jpg';
            await bot.sendPhoto(msg.chat.id, anjaIMG, {
                caption: message,
                parse_mode: 'HTML',
                reply_markup: keyboard.reply_markup,
            });
        })();
        break;
    case '/privacy':
        (async () => {
            const message =
          '<b>🔴 IMPORTANT INFO REGARDING YOUR DATA & PRIVACY 🔴</b>\n\nI understand that as a Bitcoiner, you want to know what happens with your data. To provide you with personalized job alerts, we need to securely store your chosen keywords and the associated chat ID.\n\n<b>I do not know who you are or what your Telegram handle is.</b>\n\nIf you are not comfortable with this, please do not use this feature!';
            await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
        })();
        break;
    default:
        break;
    }
});

bot.on('callback_query', async (callbackQuery) => {
    if (!callbackQuery.message) return;
    const chatId = callbackQuery.message.chat.id;
    const userConfigs = getUserConfigs();
    const userLanguage = userConfigs[chatId]?.language || PARAMETERS.LANGUAGE;

    let messageText = '';

    switch (callbackQuery.data) {
    case 'last-week':
        (async () => {
            const JobArray = await getLatestJobs();
            await sendParseMessage(chatId, JobArray, bot, ['']);
        })();
        break;
    case 'current-alerts':
        (async () => {
            const jobAlertsData = await hasJobAlert(chatId.toString());
        
            if (jobAlertsData && jobAlertsData.length > 0) {
                const formattedJobAlerts = jobAlertsData.join(', ');
        
                const message = jobAlertsData.length === 1
                    ? `Your current job alert is: ${formattedJobAlerts}`
                    : `Your current job alerts are: ${formattedJobAlerts}`;
        
                bot.sendMessage(chatId, message);
            } else {
                bot.sendMessage(chatId, 'You don\'t have any job alerts set up.');
            }
        })();
        
        break;
    case 'delete-alerts':
        (async () => {
            const chatId = callbackQuery.message?.chat.id;
            if (!chatId) return;
            const response = await deleteJobAlerts(chatId.toString());
            if (response) {
                await bot.sendMessage(chatId, 'Job alert deleted!');
            } else {
                await bot.sendMessage(
                    chatId,
                    'Something went wrong. Please try again.'
                );
            }
        })();
        break;
    case 'query-keyword':
        waitingForKeywords = true;
        messageText = TRANSLATIONS[userLanguage].general['query-keywords'];
        break;
    case 'explore-categories':
        (async () => {
            const chatId = callbackQuery.message?.chat.id.toString();
            if (!chatId) return;
            const message_id = callbackQuery.message?.message_id.toString();
            if (message_id) {
                await bot.deleteMessage(chatId, message_id);
            }
            const keyboard = {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: 'Engineering/IT', callback_data: 'engineering' },
                            { text: 'Customer Support', callback_data: 'customer-op' },
                        ],
                        [
                            { text: 'Legal', callback_data: 'legal' },
                            { text: 'Design', callback_data: 'design' },
                            { text: 'Marketing', callback_data: 'marketing' },
                        ],
                        [
                            { text: 'Operations/Finance', callback_data: 'finance' },
                            { text: 'Sales/Marketing', callback_data: 'sales' },
                        ],
                        [
                            { text: 'HR', callback_data: 'hr' },
                            { text: 'Creative', callback_data: 'creative' },
                            { text: 'Voluneering', callback_data: 'volunteering' },
                        ],
                    ],
                },
            };
            await bot.sendMessage(
                chatId,
                TRANSLATIONS[userLanguage].general.categories,
                keyboard
            );
        })();
        break;
    case 'design':
        (async () => {
            const catArray = await getLatestJobs([
                'design',
                'ui',
                'ux',
                'graphic',
                'web design',
            ]);
            await sendParseMessage(chatId, catArray, bot, ['in UI/UX Design']);
        })();
        break;
    case 'sales':
        (async () => {
            const catArray = await getLatestJobs([
                'sales',
                'marketing',
                'Business Development',
                'BizDev',
                'Sales Development',
                'Inside Sales Representative',
                'Capital Raiser',
                'Fundraising',
                'Paid Acquisition',
                'Event Management',
            ]);
            await sendParseMessage(chatId, catArray, bot, ['in Sales']);
        })();
        break;
    case 'legal':
        (async () => {
            const catArray = await getLatestJobs([
                'Lawyer',
                'Counsel',
                'Compliance',
                'Regulatory',
                'AML',
                'KYC',
                'risk analyst',
            ]);
            await sendParseMessage(chatId, catArray, bot, ['in Legal']);
        })();
        break;
    case 'engineering':
        (async () => {
            const catArray = await getLatestJobs([
                'engineering',
                'software',
                'developer',
                'devops',
                'Mobile App,',
                'Security',
                'Technician',
                'QA',
            ]);
            await sendParseMessage(chatId, catArray, bot, ['in Engineering/IT']);
        })();
        break;
    case 'customer-op':
        (async () => {
            const catArray = await getLatestJobs([
                'Customer Success',
                'Customer Happiness',
                ' Customer Service',
                'Technical Support',
                'Helpdesk',
                'Onboarding',
                'Community Manager',
            ]);
            await sendParseMessage(chatId, catArray, bot, ['in Customer Support']);
        })();
        break;
    case 'finance':
        (async () => {
            const catArray = await getLatestJobs([
                'Personal Assistant',
                'Office Manager',
                ' Customer Service',
                'risk analyst,',
                'trading',
                'fund manager',
            ]);
            await sendParseMessage(chatId, catArray, bot, [
                'in Operations/Finance',
            ]);
        })();
        break;
    case 'hr':
        (async () => {
            const catArray = await getLatestJobs([
                'Human Resources',
                'People Operations',
                'People Business Partner',
                'Recruiter',
            ]);
            await sendParseMessage(chatId, catArray, bot, ['in HR']);
        })();
        break;
    case 'creative':
        (async () => {
            const catArray = await getLatestJobs([
                'Content Creator',
                'Copywriter',
                'video editor',
            ]);
            await sendParseMessage(chatId, catArray, bot, ['in Creative']);
        })();
        break;
    case 'volunteering':
        (async () => {
            const catArray = await getLatestJobs([
                'volunteer',
                'intern',
                'apprentice',
                'volunteering',
            ]);
            await sendParseMessage(chatId, catArray, bot, ['in Volunteering']);
        })();
        break;
    default:
        break;
    }
    if (messageText) {
        await bot.sendMessage(chatId, messageText);
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
