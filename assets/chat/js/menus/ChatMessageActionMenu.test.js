// @ts-nocheck

// The scroll plugin pulls in a CSS import that jest can't parse, and this menu
// never uses it. Stub it so the import chain stays JS-only.
jest.mock('../scroll', () => ({ __esModule: true, default: class {} }));

import { readFileSync } from 'fs';
import { resolve } from 'path';
import $ from 'jquery';
import ChatMessageActionMenu from './ChatMessageActionMenu';

const MENU_HTML = `
  <div id="message-action-menu" class="chat-menu">
    <div class="chat-menu-inner floating-window">
      <button id="spotlight-message-button" class="message-action">
        Spotlight message
      </button>
    </div>
  </div>`;

const OUTPUT_HTML = `
  <div id="chat-output-frame">
    <div class="msg-chat msg-user" data-username="destiny">
      <a class="user">Destiny</a><span class="text">yo</span>
    </div>
    <div class="msg-chat msg-user msg-continue" data-username="destiny">
      <a class="user">Destiny</a><span class="text">still me</span>
    </div>
    <div class="msg-chat msg-user msg-whisper" data-username="cake">
      <a class="user">Cake</a><span class="text">hey</span>
    </div>
    <div class="msg-chat msg-subscription msg-event">
      <span class="event-info"><a class="user">Rain</a> subscribed</span>
    </div>
    <div class="msg-chat msg-pinned"><a class="user">Mod</a></div>
    <div
      class="msg-chat msg-user msg-spotlighted"
      data-username="sally"
      data-spotlight-key="abc123"
    >
      <a class="user">Sally</a><span class="text">already lit</span>
    </div>
  </div>`;

function setup({ modPowers = true } = {}) {
  const ui = $(MENU_HTML);
  const output = $(OUTPUT_HTML);
  $(document.body).empty().append(output).append(ui);

  const messages = output
    .find('.msg-user')
    .toArray()
    .map((element, index) => ({
      ui: element,
      user: { displayName: element.dataset.username },
      timestamp: { valueOf: () => 1711503299000 + index },
      message: element.querySelector('.text')?.textContent ?? '',
    }));
  const source = { send: jest.fn() };

  const chat = {
    output,
    menus: new Map(),
    source,
    mainwindow: { messages },
    user: { hasModPowers: () => modPowers },
  };
  const menu = new ChatMessageActionMenu(ui, $('<div></div>'), chat);
  chat.menus.set('message-action-menu', menu);

  return { menu, ui, output, source, messages };
}

const hover = (output, selector) =>
  output.find(selector).trigger($.Event('mouseover'));

const trigger = () => $('.message-actions-trigger');

describe('ChatMessageActionMenu', () => {
  it('offers the trigger on a message somebody said', () => {
    const { output } = setup();

    hover(output, '.msg-user:first');

    expect(trigger().hasClass('hidden')).toBe(false);
  });

  // The reason this menu exists: a continued message renders no username, so
  // there was nothing to click.
  it('offers the trigger on a continued message, which shows no username', () => {
    const { output } = setup();

    hover(output, '.msg-continue');

    expect(trigger().hasClass('hidden')).toBe(false);
  });

  it.each([
    ['an event card', '.msg-subscription'],
    ['the pinned message', '.msg-pinned'],
    ['a whisper', '.msg-whisper'],
  ])('withholds the trigger on %s', (_label, selector) => {
    const { output } = setup();

    hover(output, '.msg-user:first');
    hover(output, selector);

    expect(trigger().hasClass('hidden')).toBe(true);
  });

  it('withholds the trigger from users without mod powers', () => {
    const { output } = setup({ modPowers: false });

    hover(output, '.msg-user:first');

    expect(trigger().hasClass('hidden')).toBe(true);
  });

  it('hides the trigger when the pointer leaves the chat', () => {
    const { output } = setup();

    hover(output, '.msg-user:first');
    output.trigger($.Event('mouseleave'));

    expect(trigger().hasClass('hidden')).toBe(true);
  });

  it('spotlights the message the trigger was sitting on', () => {
    const { output, source, messages } = setup();

    hover(output, '.msg-continue');
    trigger().trigger($.Event('click', { clientX: 10, clientY: 10 }));
    $('#spotlight-message-button').trigger('click');

    expect(source.send).toHaveBeenCalledWith('SPOTLIGHT', {
      nick: 'destiny',
      messageTimestamp: messages[1].timestamp.valueOf(),
      data: 'still me',
    });
  });

  it('clears an existing spotlight by its key', () => {
    const { ui, output, source } = setup();

    hover(output, '.msg-spotlighted');
    trigger().trigger($.Event('click', { clientX: 10, clientY: 10 }));

    expect(ui.find('#spotlight-message-button').text().trim()).toBe(
      'Remove spotlight',
    );

    $('#spotlight-message-button').trigger('click');
    expect(source.send).toHaveBeenCalledWith('UNSPOTLIGHT', { data: 'abc123' });
  });

  describe('marking the selected message', () => {
    it('marks the message the menu was opened for', () => {
      const { output } = setup();
      const message = output.find('.msg-continue')[0];

      hover(output, '.msg-continue');
      trigger().trigger($.Event('click', { clientX: 10, clientY: 10 }));

      expect(message.classList.contains('msg-menu-open')).toBe(true);
    });

    it('unmarks it when the menu closes', () => {
      const { menu, output } = setup();
      const message = output.find('.msg-continue')[0];

      hover(output, '.msg-continue');
      trigger().trigger($.Event('click', { clientX: 10, clientY: 10 }));
      menu.hide();

      expect(message.classList.contains('msg-menu-open')).toBe(false);
    });

    // The trigger moves between messages without the menu closing in between.
    it('moves the mark rather than leaving two behind', () => {
      const { output } = setup();
      const first = output.find('.msg-user:first')[0];
      const second = output.find('.msg-continue')[0];

      hover(output, '.msg-user:first');
      trigger().trigger($.Event('click', { clientX: 10, clientY: 10 }));
      hover(output, '.msg-continue');
      trigger().trigger($.Event('click', { clientX: 10, clientY: 10 }));

      expect(first.classList.contains('msg-menu-open')).toBe(false);
      expect(second.classList.contains('msg-menu-open')).toBe(true);
      expect(document.querySelectorAll('.msg-menu-open')).toHaveLength(1);
    });

    // The mark is only a class; without a stylesheet behind it nothing lights
    // up, and jsdom never loads the SCSS to notice.
    it('has a stylesheet rule that tints the marked message', () => {
      const scss = readFileSync(
        resolve(__dirname, '../../css/messages/modifiers/_menu-open.scss'),
        'utf8',
      );

      expect(scss).toMatch(/\.msg-menu-open\s*\{[^{}]*background-image/);
    });
  });

  it('reports whether the layout ships its markup', () => {
    const { menu } = setup();

    expect(menu.available).toBe(true);
    expect(
      new ChatMessageActionMenu($(), $('<div></div>'), menu.chat).available,
    ).toBe(false);
  });

  // The trigger hides itself with the `hidden` class, which does nothing
  // unless a stylesheet backs it — a class-presence assertion cannot tell the
  // difference, because jsdom never loads the SCSS.
  it('has a stylesheet rule that makes the hidden class bite', () => {
    const scss = readFileSync(
      resolve(__dirname, '../../css/menus/_message-action-menu.scss'),
      'utf8',
    );

    expect(scss).toMatch(
      /\.message-actions-trigger[\s\S]*&\.hidden\s*\{[^}]*display:\s*none/,
    );
  });
});
