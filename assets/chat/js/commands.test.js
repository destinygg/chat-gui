import ChatCommands, {
  CHAT_COMMANDS,
  NAME_MISSING_ERROR,
  DESCRIPTION_MISSING_ERROR,
} from './commands';

test('Commands should be sorted alphabetically', () => {
  expect(CHAT_COMMANDS).toStrictEqual(
    [...CHAT_COMMANDS].sort((a, b) => a.name.localeCompare(b.name))
  );
});

describe('Commands are correctly formatted', () => {
  test.each(CHAT_COMMANDS)(
    'Command name should be lowercase - %s',
    (command) => {
      expect(command.name).toBe(command.name.toLowerCase());
    }
  );
  test.each(CHAT_COMMANDS)(
    'Command description should end with a dot - %s',
    (command) => {
      expect(command.description.slice(-1)).toBe('.');
    }
  );
});

describe('Valid commands', () => {
  test.each([
    [
      'Command with just a name and a description',
      {
        name: 'unignore',
        description: 'Remove <nick> from your ignore list.',
      },
      ' /unignore - Remove <nick> from your ignore list. \r',
    ],
    [
      'Command with one alias',
      {
        name: 'stalk',
        description: 'Return a list of messages from <nick>.',
        alias: ['s'],
      },
      ' /stalk, /s - Return a list of messages from <nick>. \r',
    ],
    [
      'Command with multiple aliases',
      {
        name: 'message',
        description: 'Send a whisper to <nick>.',
        alias: ['msg', 'whisper', 'w', 'tell', 't', 'notify'],
      },
      ' /message, /msg, /whisper, /w, /tell, /t, /notify - Send a whisper to <nick>. \r',
    ],
    [
      'Admin command',
      {
        name: 'mute',
        description: 'Stop <nick> from sending messages.',
        admin: true,
      },
      ' /mute - Stop <nick> from sending messages. \r',
    ],
  ])('%s', (_, command, expectedHelpString) => {
    const chatCommandsGenerator = new ChatCommands();
    expect(chatCommandsGenerator.formatHelpString(command)).toBe(
      expectedHelpString
    );
  });
});

describe('Invalid commands', () => {
  test.each([
    [
      'Command with no name',
      {
        description: 'Remove <nick> from your ignore list.',
      },
      NAME_MISSING_ERROR,
    ],
    [
      'Command with no description',
      {
        name: 'stalk',
      },
      DESCRIPTION_MISSING_ERROR,
    ],
  ])('%s', (_, command, expectedError) => {
    const chatCommandsGenerator = new ChatCommands();
    expect(() => chatCommandsGenerator.formatHelpString(command)).toThrow(
      expectedError
    );
  });
});
