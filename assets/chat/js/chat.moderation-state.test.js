import $ from 'jquery';
import Chat from './chat';
import ChatUser from './user';
import ChatSource from './source';
import { MessageBuilder } from './messages';

jest.mock('yargs-parser/browser', () => ({
  __esModule: true,
  default: () => ({}),
}));

jest.mock('../../views/templates.html', () => '');

function createChat({ subTier = 0, roles = [] } = {}) {
  const chat = new Chat({ source: new ChatSource() });
  chat.user = new ChatUser({
    nick: 'Chatter',
    roles,
    subscription: subTier > 0 ? { tier: subTier } : null,
  });
  chat.input = $('<textarea></textarea>');
  chat.mainwindow = { update: jest.fn() };

  const container = $('<div id="chat-input-state" hidden></div>');
  const icon = $('<span id="chat-input-state-icon"></span>').appendTo(
    container,
  );
  const badge = $('<span id="chat-input-state-badge"></span>').appendTo(icon);
  chat.moderationStateContainer = container;
  chat.moderationIndicator = icon;
  chat.moderationBadge = badge;

  return chat;
}

function states(overrides = {}) {
  return {
    subonly: { tier: 0, changedBy: '', timestamp: 0 },
    nukes: [],
    mutelinks: { mode: 'off' },
    breakingnews: { mode: 'off' },
    nukedUsers: [],
    timestamp: 0,
    ...overrides,
  };
}

describe('Chat moderation state', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('subscribes to STATES and MODACTION, not outbound SUBONLY', () => {
    const chat = createChat();

    expect(chat.source.listeners.has('STATES')).toBe(true);
    expect(chat.source.listeners.has('MODACTION')).toBe(true);
    expect(chat.source.listeners.has('SUBONLY')).toBe(false);
  });

  test('STATES updates the indicator without rendering a line', () => {
    const chat = createChat();
    const command = jest.spyOn(MessageBuilder, 'command');

    chat.onSTATES(states({ subonly: { tier: 2 } }));

    expect(command).not.toHaveBeenCalled();
    expect(chat.subonly).toBe(2);
    expect(chat.moderationStateContainer.prop('hidden')).toBe(false);
    expect(chat.moderationStateContainer.attr('data-mode')).toBe('subonly');
    expect(chat.moderationBadge.prop('hidden')).toBe(true);
    expect(chat.moderationIndicator.attr('aria-label')).toBe(
      'Subscriber only mode active',
    );
  });

  test('badge counts additional visible modes', () => {
    const chat = createChat();

    chat.onSTATES(
      states({
        subonly: { tier: 1 },
        nukes: [
          {
            key: 'plain:hi',
            phrase: 'hi',
            expiresAt: Date.now() + 60000,
          },
        ],
        mutelinks: { mode: 'all' },
      }),
    );

    expect(chat.moderationStateContainer.attr('data-mode')).toBe('subonly');
    expect(chat.moderationBadge.text()).toBe('+2');
    expect(chat.moderationBadge.prop('hidden')).toBe(false);
    expect(chat.moderationIndicator.attr('aria-label')).toBe(
      'Subscriber only mode active, 2 more active moderation modes',
    );
  });

  test('a subscriber at the tier sees the next mode instead', () => {
    const chat = createChat({ subTier: 2 });

    chat.onSTATES(
      states({
        subonly: { tier: 2 },
        nukes: [
          {
            key: 'plain:hi',
            phrase: 'hi',
            expiresAt: Date.now() + 60000,
          },
        ],
      }),
    );

    expect(chat.moderationStateContainer.attr('data-mode')).toBe('nuke');
    expect(chat.moderationBadge.prop('hidden')).toBe(true);
  });

  test('hides the indicator when no mode is visible', () => {
    const chat = createChat();
    chat.onSTATES(states({ subonly: { tier: 1 } }));
    expect(chat.moderationStateContainer.prop('hidden')).toBe(false);

    chat.onSTATES(states());

    expect(chat.moderationStateContainer.prop('hidden')).toBe(true);
    expect(chat.moderationIndicator.attr('aria-label')).toBeUndefined();
    expect(chat.moderationBadge.prop('hidden')).toBe(true);
  });

  test('MODACTION renders a subonly line from its payload', () => {
    const chat = createChat();
    const into = jest.fn();
    const command = jest
      .spyOn(MessageBuilder, 'command')
      .mockReturnValue({ into });

    chat.onMODACTION({
      action: 'subonly',
      payload: { mode: 'on', tier: 2 },
      nick: 'ModName',
      timestamp: 1770000000000,
    });

    expect(command).toHaveBeenCalledWith(
      'Subscriber only mode (Tier 2+) enabled by ModName.',
      1770000000000,
    );
    expect(into).toHaveBeenCalledWith(chat);
  });

  test('MODACTION never changes the state or indicator', () => {
    const chat = createChat();
    chat.onSTATES(states({ subonly: { tier: 3 } }));
    const before = chat.moderationState;
    jest.spyOn(MessageBuilder, 'command').mockReturnValue({ into: jest.fn() });

    chat.onMODACTION({
      action: 'subonly',
      payload: { mode: 'off' },
      nick: 'ModName',
      timestamp: 1770000000000,
    });

    expect(chat.moderationState).toBe(before);
    expect(chat.subonly).toBe(3);
    expect(chat.moderationStateContainer.attr('data-mode')).toBe('subonly');
  });

  test('unknown MODACTION actions render nothing', () => {
    const chat = createChat();
    const command = jest.spyOn(MessageBuilder, 'command');

    chat.onMODACTION({ action: 'future-action', payload: {} });

    expect(command).not.toHaveBeenCalled();
  });

  test('HISTORY replays past MODACTION lines', () => {
    const chat = createChat();
    const into = jest.fn();
    const command = jest
      .spyOn(MessageBuilder, 'command')
      .mockReturnValue({ into });

    chat.onHISTORY([
      `MODACTION ${JSON.stringify({
        action: 'subonly',
        payload: { mode: 'off' },
        nick: 'ModName',
        timestamp: 1770000000000,
      })}`,
    ]);

    expect(command).toHaveBeenCalledWith(
      'Subscriber only mode disabled by ModName.',
      1770000000000,
    );
    expect(into).toHaveBeenCalledWith(chat);
  });

  test('malformed state is logged once and falls back to defaults', () => {
    const chat = createChat();
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    chat.onSTATES({ nukes: 'not an array' });
    chat.onSTATES({ nukes: 'still not an array' });

    expect(warn).toHaveBeenCalledTimes(1);
    expect(chat.moderationState.nukes).toEqual([]);
    expect(chat.moderationStateContainer.prop('hidden')).toBe(true);
  });
});
