// @ts-nocheck

// The scroll plugin pulls in a CSS import jest can't parse; the fixture omits
// `.scrollable` so the base menu never builds one, and this stub keeps the
// import chain JS-only.
jest.mock('../scroll', () => ({ __esModule: true, default: class {} }));

import $ from 'jquery';
import ChatWhisperUsers from './ChatWhisperUsers';

const MENU_HTML = `
  <div id="chat-whisper-users">
    <div class="toolbar"><h5><span>Whispers</span></h5></div>
    <div class="content">
      <ul></ul>
      <div class="whisper-load-more" style="display: none">
        <button type="button">Load more</button>
      </div>
    </div>
    <div id="chat-whisper-search">
      <input type="text" class="form-control" value="" />
    </div>
  </div>`;

const EMPTY_PAGE = { results: [], more: false, nextPageOffset: null };

function dto(username, overrides = {}) {
  return {
    userId: username.length,
    username,
    lastMessage: `msg from ${username}`,
    timestamp: '2026-01-01T10:00:00+0000',
    unread: 0,
    lastMessageFromMe: false,
    ...overrides,
  };
}

function makeMenu() {
  const ui = $(MENU_HTML);
  const chat = {
    whispers: new Map(),
    users: new Map(),
    config: { api: { base: '' } },
    isDesktop: false,
    openConversation: jest.fn(),
  };
  const menu = new ChatWhisperUsers(ui, $('<div></div>'), chat);
  return { menu, ui, chat };
}

// Flush the fetch → json → render promise chain.
async function flush() {
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await Promise.resolve();
}

beforeEach(() => {
  fetch.resetMocks();
  fetch.mockResponse(JSON.stringify(EMPTY_PAGE));
});

describe('ChatWhisperUsers list', () => {
  it('loads the first page on show and renders rows newest-first', async () => {
    fetch.mockResponseOnce(
      JSON.stringify({
        results: [
          dto('Alice', { unread: 2 }),
          dto('Bob', { lastMessage: 'yo', lastMessageFromMe: true }),
        ],
        more: false,
        nextPageOffset: null,
      }),
    );
    const { menu, ui } = makeMenu();

    menu.show();
    await flush();

    const rows = ui.find('.conversation');
    expect(rows.length).toBe(2);
    expect(rows.eq(0).find('.conversation__user').text()).toBe('Alice');
    expect(rows.eq(0).find('.badge').text()).toBe('2');
    // "You:" prefix when the last message was sent by the viewer.
    expect(rows.eq(1).find('.conversation__preview').text()).toBe('You: yo');
    // Read row is marked so CSS can dim it.
    expect(rows.eq(1).hasClass('unread-0')).toBe(true);
  });

  it('appends the next page and passes the cursor, hiding the button when done', async () => {
    fetch.mockResponseOnce(
      JSON.stringify({
        results: [dto('Alice')],
        more: true,
        nextPageOffset: { timestamp: '2026-01-01 09:00:00.000', id: 42 },
      }),
    );
    const { menu, ui } = makeMenu();
    menu.show();
    await flush();
    expect(menu.loadMoreEl.get(0).style.display).not.toBe('none');

    fetch.mockResponseOnce(
      JSON.stringify({
        results: [dto('Bob')],
        more: false,
        nextPageOffset: null,
      }),
    );
    menu.loadMore();
    await flush();

    // Page 1 row is kept, page 2 appended (not a rebuild).
    expect(ui.find('.conversation').length).toBe(2);
    const lastUrl = fetch.mock.calls[fetch.mock.calls.length - 1][0];
    expect(lastUrl).toContain('last-timestamp=');
    expect(lastUrl).toContain('last-id=42');
    // No more pages → button hidden.
    expect(menu.loadMoreEl.get(0).style.display).toBe('none');
  });

  it('searches server-side and restores the normal list on clear without refetching', async () => {
    fetch.mockResponseOnce(
      JSON.stringify({
        results: [dto('Alice'), dto('Bob')],
        more: false,
        nextPageOffset: null,
      }),
    );
    const { menu, ui } = makeMenu();
    menu.show();
    await flush();
    expect(ui.find('.conversation').length).toBe(2);

    fetch.mockResponseOnce(
      JSON.stringify({
        results: [dto('Alice')],
        more: false,
        nextPageOffset: null,
      }),
    );
    menu.searchterm = 'ali';
    menu.onSearchChange();
    await flush();

    expect(ui.find('.conversation').length).toBe(1);
    const searchUrl = fetch.mock.calls[fetch.mock.calls.length - 1][0];
    expect(searchUrl).toContain('search=ali');

    const callsBeforeClear = fetch.mock.calls.length;
    menu.searchterm = '';
    menu.onSearchChange();
    await flush();

    // Clearing search re-renders the retained normal list — no new request.
    expect(ui.find('.conversation').length).toBe(2);
    expect(fetch.mock.calls.length).toBe(callsBeforeClear);
  });
});

describe('ChatWhisperUsers badge', () => {
  it('renders the scalar count and never sums the whispers Map', () => {
    const { menu, chat } = makeMenu();
    // Stale per-conversation counts that must NOT influence the badge.
    chat.whispers.set('alice', { unread: 99 });
    const indicator = menu.notif;

    menu.seedUnread(5);
    expect(indicator.text()).toBe('5');
    expect(indicator.get(0).style.display).not.toBe('none');

    menu.decrementUnread(2);
    expect(indicator.text()).toBe('3');

    menu.incrementUnread(1);
    expect(indicator.text()).toBe('4');

    menu.seedUnread(0);
    expect(indicator.text()).toBe('0');
    expect(indicator.get(0).style.display).toBe('none');
  });

  it('never goes negative', () => {
    const { menu } = makeMenu();
    menu.seedUnread(1);
    menu.decrementUnread(5);
    expect(menu.notif.text()).toBe('0');
  });
});

describe('ChatWhisperUsers rows', () => {
  it('renders the message preview as text so markup cannot inject', () => {
    const { menu, chat } = makeMenu();
    chat.whispers.set('alice', {
      nick: 'Alice',
      username: 'alice',
      unread: 0,
      lastMessage: '<b>pwned</b>',
      timestamp: null,
      lastMessageFromMe: false,
    });

    const row = menu.buildRow('alice');
    const preview = row.find('.conversation__preview');
    expect(preview.text()).toBe('<b>pwned</b>');
    expect(preview.find('b').length).toBe(0);
  });

  it('moves a conversation to the top and dedupes', () => {
    const { menu } = makeMenu();
    menu.conversations = ['a', 'b', 'c'];

    menu.bumpConversation('c');
    expect(menu.conversations).toEqual(['c', 'a', 'b']);

    menu.bumpConversation('d');
    expect(menu.conversations).toEqual(['d', 'c', 'a', 'b']);
  });
});
