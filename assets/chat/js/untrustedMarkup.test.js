// @ts-nocheck

// Flair labels and emote prefixes are set by staff with no other privileges,
// and reach every viewer's chat. None of them may become markup.

// The scroll plugin pulls in a CSS import that jest can't parse; the menus
// never use it here.
jest.mock('./scroll', () => ({ __esModule: true, default: class {} }));

import $ from 'jquery';
import EmoteService from './emotes';
import EmoteFormatter from './formatters/EmoteFormatter';
import HtmlTextFormatter from './formatters/HtmlTextFormatter';
import ChatUserMessage from './messages/ChatUserMessage';
import ChatUserMenu from './menus/ChatUserMenu';
import ChatUserInfoMenu from './menus/ChatUserInfoMenu';
import ChatEmoteMenu from './menus/ChatEmoteMenu';
import ChatEmoteTooltip from './menus/ChatEmoteTooltip';
import ChatAutoComplete from './autocomplete';

const LABEL = `"><img src=x onerror=alert(1)>`;
const PREFIX = `PEPO"onmouseover=alert(1)`;

const flair = { name: 'flair1', label: LABEL, priority: 1 };

/** Parses markup the way the chat inserts it and reports what got built. */
function parse(html) {
  const container = document.createElement('div');
  container.innerHTML = html;
  return container;
}

function expectInert(container) {
  expect(container.querySelector('img')).toBeNull();
  container.querySelectorAll('*').forEach((el) => {
    expect(el.hasAttribute('onmouseover')).toBe(false);
    expect(el.hasAttribute('onerror')).toBe(false);
  });
}

describe('flair labels', () => {
  const chat = { flairsMap: new Map([['flair1', flair]]) };

  it('stay text in a chat message', () => {
    const html = ChatUserMessage.prototype.buildFeatures(
      { features: ['flair1'] },
      chat,
    );

    const container = parse(html);
    expectInert(container);
    expect(container.querySelector('i.flair').title).toBe(LABEL);
  });

  it('stay text in the user list', () => {
    const html = ChatUserMenu.prototype.buildFeatures.call({ chat }, [
      'flair1',
    ]);

    const container = parse(html);
    expectInert(container);
    expect(container.querySelector('i.flair').title).toBe(LABEL);
  });

  it('stay text in the user info menu, hidden flairs included', () => {
    const hidden = { ...flair, name: 'flair2', hidden: true };
    const menuChat = {
      flairsMap: new Map([
        ['flair1', flair],
        ['flair2', hidden],
      ]),
    };

    const html = ChatUserInfoMenu.prototype.buildFeatureHTML.call(
      { chat: menuChat },
      ['flair1', 'flair2'],
    );

    const container = parse(html);
    expectInert(container);
    expect(container.querySelector('div.flair').textContent).toBe(LABEL);
  });
});

describe('emote prefixes', () => {
  function chatWithEmotes(...prefixes) {
    const emoteService = new EmoteService();
    emoteService.setEmotes(
      prefixes.map((prefix) => ({ prefix, minimumSubTier: 0, twitch: false })),
    );
    return { emoteService };
  }

  it("can't break out of a message's emote markup", () => {
    const chat = chatWithEmotes(PREFIX);
    const escaped = new HtmlTextFormatter().format(chat, `hi ${PREFIX}`);

    const html = new EmoteFormatter().format(chat, escaped);

    const container = parse(html);
    expectInert(container);
    expect(container.querySelector('.emote').title).toBe(PREFIX);
  });

  it('are matched literally, not as patterns', () => {
    const chat = chatWithEmotes('a+', '(', 'PepeLaugh');

    expect(() => chat.emoteService.systemEmoteRegex).not.toThrow();
    const html = new EmoteFormatter().format(chat, 'aaa a+ PepeLaugh');

    const container = parse(html);
    expect(
      [...container.querySelectorAll('.emote')].map((e) => e.title),
    ).toEqual(['a+', 'PepeLaugh']);
  });

  it('stay text in the emote menu', () => {
    const html = ChatEmoteMenu.prototype.buildEmoteItem.call(
      { searchterm: '' },
      LABEL,
      false,
      false,
    );

    const container = parse(html);
    expectInert(container);
    expect(container.querySelector('.emote').textContent).toBe(LABEL);
  });

  it('stay text in the emote menu while searching', () => {
    const html = ChatEmoteMenu.prototype.buildEmoteItem.call(
      { searchterm: 'img' },
      LABEL,
      false,
      false,
    );

    expectInert(parse(html));
  });
});

describe('emote prefixes elsewhere', () => {
  it('stay text in autocomplete suggestions', () => {
    const list = document.createElement('ul');

    ChatAutoComplete.prototype.buildHelpers.call({
      results: [{ data: LABEL, isemote: true }],
      container: [list],
    });

    expectInert(list);
    expect(list.querySelector('.autocomplete-entry__name').textContent).toBe(
      LABEL,
    );
  });

  it('stay text in the emote tooltip', () => {
    const ui = { name: $('<span></span>'), emote: $('<div></div>') };
    const { set } = Object.getOwnPropertyDescriptor(
      ChatEmoteTooltip.prototype,
      'emote',
    );

    set.call({ ui }, LABEL);

    expectInert(ui.emote[0]);
    expect(ui.emote.text()).toBe(LABEL);
  });
});

describe('jQuery insertion', () => {
  it('of escaped labels builds no elements', () => {
    const chat = { flairsMap: new Map([['flair1', flair]]) };
    const target = $('<div></div>');

    target.html(
      ChatUserMenu.prototype.buildFeatures.call({ chat }, ['flair1']),
    );

    expectInert(target[0]);
  });
});
