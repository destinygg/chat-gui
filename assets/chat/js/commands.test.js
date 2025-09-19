import { CHAT_COMMANDS, getSlashCommand, removeSlashCommand } from './commands';

describe('Commands should be valid', () => {
  test.each(CHAT_COMMANDS)('Command should have a name - %s', (command) => {
    expect(command.name).toBeTruthy();
  });
  test.each(CHAT_COMMANDS)(
    'Command should have a description - %s',
    (command) => {
      expect(command.description).toBeTruthy();
    },
  );
});

test('Commands should be sorted alphabetically', () => {
  expect(CHAT_COMMANDS).toStrictEqual(
    [...CHAT_COMMANDS].sort((a, b) => a.name.localeCompare(b.name)),
  );
});

describe('Commands should be correctly formatted', () => {
  test.each(CHAT_COMMANDS)(
    'Command name should be lowercase - %s',
    (command) => {
      expect(command.name).toBe(command.name.toLowerCase());
    },
  );
  test.each(CHAT_COMMANDS)(
    'Command description should end with a dot - %s',
    (command) => {
      expect(command.description.slice(-1)).toBe('.');
    },
  );
});

describe('getSlashCommand', () => {
  test('should extract command from message with slash', () => {
    expect(getSlashCommand('/help')).toBe('HELP');
    expect(getSlashCommand('/ban user123')).toBe('BAN');
    expect(getSlashCommand('/mute someone 5m')).toBe('MUTE');
  });

  test('should handle commands with optional whitespace', () => {
    expect(getSlashCommand('/help ')).toBe('HELP');
    expect(getSlashCommand('/ban  ')).toBe('BAN');
  });

  test('should return undefined for non-slash messages', () => {
    expect(getSlashCommand('help')).toBeUndefined();
    expect(getSlashCommand('regular message')).toBeUndefined();
    expect(getSlashCommand('no slash here')).toBeUndefined();
  });

  test('should return undefined for empty or null input', () => {
    expect(getSlashCommand('')).toBeUndefined();
    expect(getSlashCommand(null)).toBeUndefined();
    expect(getSlashCommand(undefined)).toBeUndefined();
  });

  test('should be case insensitive', () => {
    expect(getSlashCommand('/HELP')).toBe('HELP');
    expect(getSlashCommand('/Help')).toBe('HELP');
    expect(getSlashCommand('/hElP')).toBe('HELP');
  });

  test('should not match commands in middle of text', () => {
    expect(getSlashCommand('text /help more')).toBeUndefined();
    expect(getSlashCommand('prefix/help')).toBeUndefined();
  });
});

describe('removeSlashCommand', () => {
  test('should remove slash command from message', () => {
    expect(removeSlashCommand('/help')).toBe('');
    expect(removeSlashCommand('/ban user123')).toBe('user123');
    expect(removeSlashCommand('/mute someone 5m')).toBe('someone 5m');
  });

  test('should handle commands with optional whitespace', () => {
    expect(removeSlashCommand('/help ')).toBe('');
    expect(removeSlashCommand('/ban  user123')).toBe('user123');
    expect(removeSlashCommand('/mute  someone  5m')).toBe('someone  5m');
  });

  test('should return original text for non-slash messages', () => {
    expect(removeSlashCommand('help')).toBe('help');
    expect(removeSlashCommand('regular message')).toBe('regular message');
    expect(removeSlashCommand('no slash here')).toBe('no slash here');
  });

  test('should return an empty string for empty input', () => {
    expect(removeSlashCommand('')).toBe('');
  });

  test('should return undefined for empty or null input', () => {
    expect(removeSlashCommand(null)).toBeUndefined();
    expect(removeSlashCommand(undefined)).toBeUndefined();
  });

  test('should be case insensitive', () => {
    expect(removeSlashCommand('/HELP')).toBe('');
    expect(removeSlashCommand('/Help user123')).toBe('user123');
    expect(removeSlashCommand('/hElP someone')).toBe('someone');
  });

  test('should not remove commands in middle of text', () => {
    expect(removeSlashCommand('text /help more')).toBe('text /help more');
    expect(removeSlashCommand('prefix/help')).toBe('prefix/help');
  });

  test('should trim whitespace from result', () => {
    expect(removeSlashCommand('/help  ')).toBe('');
    expect(removeSlashCommand('/ban  user123  ')).toBe('user123');
  });
});
