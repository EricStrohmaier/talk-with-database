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
    ]);
}