import { CHAT_COMMANDS } from './commands';

test('Commands are sorted correctly', () => {
  expect(CHAT_COMMANDS).toStrictEqual(
    [...CHAT_COMMANDS].sort((a, b) => a.name.localeCompare(b.name))
  );
});
