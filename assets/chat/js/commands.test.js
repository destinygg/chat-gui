import { CHAT_COMMANDS } from './commands';

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
