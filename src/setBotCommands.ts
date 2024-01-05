import { TRANSLATIONS } from './translation';

export function setBotCommands(
    bot: { setMyCommands: (arg0: { command: string; description: string; }[]) => void; },
) { 
    bot.setMyCommands([
        {
            command: 'start',
            description:
      TRANSLATIONS['en'][
          'command-descriptions'
      ].start,
        },
        {
            command:'post',
            description:'Create a Instagram Post',
        },
        {
            command:'story',
            description:'Create a Instagram Story',
        },
        {
            command:'video',
            description:'Create a Instagram Video',
        }
        
    ]);
}