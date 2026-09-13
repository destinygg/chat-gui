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

// `ChatUserMessage` renders the trigger into every user message; the fixture
// mirrors that.
const trigger = '<button class="message-actions-trigger"></button>';

const OUTPUT_HTML = `
  <div id="chat-output-frame">
    <div class="msg-chat msg-user" data-username="destiny">
      <a class="user">Destiny</a><span class="text">yo</span>${trigger}
    </div>
    <div class="msg-chat msg-user msg-continue" data-username="destiny">
      <a class="user">Destiny</a><span class="text">still me</span>${trigger}
    </div>
    <div
      class="msg-chat msg-user msg-spotlighted"
      data-username="sally"
      data-spotlight-key="abc123"
    >
      <a class="user">Sally</a><span class="text">already lit</span>${trigger}
    </div>
  </div>`;

function setup() {
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
  };
  const menu = new ChatMessageActionMenu(ui, $('<div></div>'), chat);
  chat.menus.set('message-action-menu', menu);

  return { menu, ui, output, source, messages };
}

const clickTriggerIn = (output, selector) =>
  output
    .find(`${selector} .message-actions-trigger`)
    .trigger($.Event('click', { clientX: 10, clientY: 10 }));

const styles = (file) =>
  readFileSync(resolve(__dirname, `../../css/${file}`), 'utf8');

describe('ChatMessageActionMenu', () => {
  it('opens for the message its trigger belongs to', () => {
    const { ui, output } = setup();

    clickTriggerIn(output, '.msg-user:first');

    expect(ui.hasClass('active')).toBe(true);
    expect(ui.find('#spotlight-message-button').text().trim()).toBe(
      'Spotlight message',
    );
  });

  // The reason this menu exists: a continued message renders no username, so
  // there was nothing to click.
  it('opens from a continued message, which shows no username', () => {
    const { ui, output, source, messages } = setup();

    clickTriggerIn(output, '.msg-continue');
    $('#spotlight-message-button').trigger('click');

    expect(ui.hasClass('active')).toBe(false);
    expect(source.send).toHaveBeenCalledWith('SPOTLIGHT', {
      nick: 'destiny',
      messageTimestamp: messages[1].timestamp.valueOf(),
      data: 'still me',
    });
  });

  it('clears an existing spotlight by its key', () => {
    const { ui, output, source } = setup();

    clickTriggerIn(output, '.msg-spotlighted');
    expect(ui.find('#spotlight-message-button').text().trim()).toBe(
      'Remove spotlight',
    );

    $('#spotlight-message-button').trigger('click');
    expect(source.send).toHaveBeenCalledWith('UNSPOTLIGHT', { data: 'abc123' });
  });

  describe('marking the selected message', () => {
    it('marks the message the menu was opened for', () => {
      const { output } = setup();

      clickTriggerIn(output, '.msg-continue');

      expect(
        output.find('.msg-continue')[0].classList.contains('msg-menu-open'),
      ).toBe(true);
    });

    it('unmarks it when the menu closes', () => {
      const { menu, output } = setup();

      clickTriggerIn(output, '.msg-continue');
      menu.hide();

      expect(
        output.find('.msg-continue')[0].classList.contains('msg-menu-open'),
      ).toBe(false);
    });

    it('moves the mark rather than leaving two behind', () => {
      const { output } = setup();

      clickTriggerIn(output, '.msg-user:first');
      clickTriggerIn(output, '.msg-continue');

      expect(
        output.find('.msg-user:first')[0].classList.contains('msg-menu-open'),
      ).toBe(false);
      expect(document.querySelectorAll('.msg-menu-open')).toHaveLength(1);
    });
  });

  it('reports whether the layout ships its markup', () => {
    const { menu } = setup();

    expect(menu.available).toBe(true);
    expect(
      new ChatMessageActionMenu($(), $('<div></div>'), menu.chat).available,
    ).toBe(false);
  });

  // Who sees the trigger, and on which messages, is decided entirely in CSS —
  // there is no JS gate left to assert. jsdom never loads the SCSS, so these
  // read the rules directly. Without them the trigger would show for everyone,
  // on every message, and nothing in JS would notice.
  describe('the stylesheet that gates the trigger', () => {
    it('hides it by default', () => {
      const scss = styles('menus/_message-action-menu.scss');

      expect(scss).toMatch(
        /\.message-actions-trigger\s*\{[^{}]*display:\s*none/,
      );
    });

    it('reveals it only for moderators, and not on whispers', () => {
      const scss = styles('menus/_message-action-menu.scss');

      expect(scss).toMatch(
        /\.chat-mod\s*\{[\s\S]*\.msg-user:not\(\.msg-whisper\):hover\s*>\s*\.message-actions-trigger/,
      );
    });

    it('anchors it against the message', () => {
      const scss = styles('messages/_base.scss');

      expect(scss).toMatch(/\.msg-chat\s*\{[^{}]*position:\s*relative/);
    });

    it('tints the message whose menu is open', () => {
      const scss = styles('messages/modifiers/_menu-open.scss');

      expect(scss).toMatch(/\.msg-menu-open\s*\{[^{}]*background-image/);
    });
  });
});
