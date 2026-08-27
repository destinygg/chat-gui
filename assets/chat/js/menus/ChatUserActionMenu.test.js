// @ts-nocheck

// The scroll plugin pulls in a CSS import that jest can't parse, and this menu
// never uses it (no `.scrollable` in the fixture). Stub it so the import chain
// stays JS-only.
jest.mock('../scroll', () => ({ __esModule: true, default: class {} }));

import { readFileSync } from 'fs';
import { resolve } from 'path';
import $ from 'jquery';
import ChatUserActionMenu from './ChatUserActionMenu';

const MENU_HTML = `
  <div id="user-action-menu" class="chat-menu">
    <div class="chat-menu-inner floating-window">
      <button id="highlight-user-button" class="user-action">Highlight</button>
      <button id="spotlight-message-button" class="user-action hidden">
        Spotlight message
      </button>
      <button id="user-info-button" class="user-action">User info</button>
    </div>
  </div>`;

const OUTPUT_HTML = `
  <div id="chat-output-frame">
    <div class="msg-chat msg-user" data-username="destiny">
      <a class="user">Destiny</a>
      <span class="text">yo <span class="chat-user">Cake</span></span>
    </div>
    <div class="msg-chat msg-user" data-username="rain">
      <a class="user tier">Tier 3</a>
      <a class="user non-chat-user">@elonmusk</a>
    </div>
    <div class="msg-chat msg-user msg-whisper" data-username="cake">
      <a class="user">Cake</a>
      <span class="text">hey</span>
    </div>
    <div class="msg-chat msg-subscription msg-event">
      <span class="event-info"><a class="user">Rain</a> is now a subscriber</span>
    </div>
    <div
      class="msg-chat msg-user msg-spotlighted"
      data-username="sally"
      data-spotlight-key="abc123"
    >
      <a class="user">Sally</a>
      <span class="text">already spotlighted</span>
    </div>
  </div>`;

function setup({ focused = [], modPowers = true } = {}) {
  const ui = $(MENU_HTML);
  const output = $(OUTPUT_HTML);
  $(document.body).empty().append(output).append(ui);

  // Stand in for the chat window's retained message objects. `ui` is the
  // rendered element, which is how the menu finds the message it was opened
  // from.
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

  const userfocus = {
    toggleElement: jest.fn(),
    isFocusedOn: (value) => focused.includes(value.toLowerCase()),
  };
  // Mirrors the real user info menu, which only its own close control hides.
  const userInfoMenu = {
    ui: $('<div id="chat-user-info"></div>'),
    closesOnOutsideInteraction: false,
    showUser: jest.fn(),
    hide: jest.fn(),
  };

  const chat = {
    output,
    userfocus,
    menus: new Map(),
    source,
    mainwindow: { messages },
    user: { hasModPowers: () => modPowers },
  };
  const menu = new ChatUserActionMenu(ui, $('<div></div>'), chat);
  chat.menus.set('user-info', userInfoMenu);
  chat.menus.set('user-action', menu);

  return { menu, ui, output, userfocus, userInfoMenu, source, messages };
}

function clickUsername(output, selector) {
  output.find(selector).trigger($.Event('click', { clientX: 10, clientY: 10 }));
}

// A user list entry, which `ChatUserMenu` hands to `openMenu` directly.
const USER_ENTRY_HTML = `
  <div class="user-entry" data-username="destiny">
    <span class="user flair13">Destiny</span>
    <div class="user-actions"><i class="whisper-nick"></i></div>
  </div>`;

describe('ChatUserActionMenu', () => {
  it('opens on a left click on a message author, offering both actions', () => {
    const { menu, ui, output } = setup();

    clickUsername(output, '.msg-user:first .user');

    expect(menu.visible).toBe(true);
    expect(ui.hasClass('active')).toBe(true);
    expect(ui.find('#highlight-user-button').text()).toBe('Highlight');
    expect(ui.find('#user-info-button').text()).toBe('User info');
    expect(menu.clickedNick).toBe('Destiny');
  });

  it('opens on a left click on an in-text mention', () => {
    const { menu, output } = setup();

    clickUsername(output, '.chat-user');

    expect(menu.visible).toBe(true);
    expect(menu.clickedNick).toBe('Cake');
    expect(menu.message.data('username')).toBe('destiny');
  });

  it('stops the click reaching the highlight-clearing output handler', () => {
    const { output } = setup();
    const outputClick = jest.fn();
    output.on('click', outputClick);

    clickUsername(output, '.msg-user:first .user');

    expect(outputClick).not.toHaveBeenCalled();
  });

  it('labels the highlight action as a removal when already highlighted', () => {
    const { ui, output } = setup({ focused: ['destiny'] });

    clickUsername(output, '.msg-user:first .user');

    expect(ui.find('#highlight-user-button').text()).toBe('Remove highlight');
  });

  it('hands the clicked element to the focus handler and closes', () => {
    const { menu, ui, output, userfocus } = setup();

    clickUsername(output, '.msg-user:first .user');
    ui.find('#highlight-user-button').trigger('click');

    expect(userfocus.toggleElement).toHaveBeenCalledWith(
      output.find('.msg-user:first .user')[0],
    );
    expect(menu.visible).toBe(false);
  });

  it('opens the user info menu for the clicked nick and closes', () => {
    const { menu, ui, output, userInfoMenu } = setup();

    clickUsername(output, '.chat-user');
    ui.find('#user-info-button').trigger('click');

    expect(userInfoMenu.showUser).toHaveBeenCalledTimes(1);
    const [, message, nick] = userInfoMenu.showUser.mock.calls[0];
    expect(nick).toBe('cake');
    expect(message.data('username')).toBe('destiny');
    expect(menu.visible).toBe(false);
  });

  it('closes when the same username is clicked again', () => {
    const { menu, output } = setup();

    clickUsername(output, '.msg-user:first .user');
    clickUsername(output, '.msg-user:first .user');

    expect(menu.visible).toBe(false);
  });

  it('ignores sub-tier labels and non-chat users', () => {
    const { menu, output } = setup();

    clickUsername(output, '.tier');
    expect(menu.visible).toBe(false);

    clickUsername(output, '.non-chat-user');
    expect(menu.visible).toBe(false);
  });

  it('leaves whisper authors to the open-conversation handler', () => {
    const { menu, output } = setup();

    clickUsername(output, '.msg-whisper .user');

    expect(menu.visible).toBe(false);
  });

  it('opens for a user list entry, keeping the list it was opened from', () => {
    const { menu, ui, userInfoMenu } = setup();
    // Stand in for the user list: a menu whose ui contains the clicked entry.
    const list = $('<div id="chat-user-list"></div>').append(USER_ENTRY_HTML);
    $(document.body).append(list);
    const listMenu = {
      ui: list,
      closesOnOutsideInteraction: true,
      hide: jest.fn(),
    };
    menu.chat.menus.set('users', listMenu);

    const entry = list.find('.user-entry')[0];
    menu.openMenu(
      $.Event('click', { currentTarget: entry, clientX: 10, clientY: 10 }),
      entry.querySelector('.user'),
      $(entry),
    );

    expect(menu.visible).toBe(true);
    expect(ui.find('#highlight-user-button').text()).toBe('Highlight');
    expect(menu.clickedNick).toBe('Destiny');
    expect(listMenu.hide).not.toHaveBeenCalled();
    // Nor the user info window, which a click elsewhere never dismisses.
    expect(userInfoMenu.hide).not.toHaveBeenCalled();
  });

  it('closes the other menus it opens over', () => {
    const { menu, output } = setup();
    const emotes = {
      ui: $('<div id="chat-emote-list"></div>'),
      closesOnOutsideInteraction: true,
      hide: jest.fn(),
    };
    menu.chat.menus.set('emotes', emotes);

    clickUsername(output, '.msg-user:first .user');

    expect(emotes.hide).toHaveBeenCalled();
  });

  describe('spotlight action', () => {
    it('offers the action to mods on a message in the log', () => {
      const { ui, output } = setup();

      clickUsername(output, '.msg-user:first .user');

      const button = ui.find('#spotlight-message-button');
      expect(button.hasClass('hidden')).toBe(false);
      expect(button.text().trim()).toBe('Spotlight message');
    });

    it('hides the action from users without mod powers', () => {
      const { ui, output } = setup({ modPowers: false });

      clickUsername(output, '.msg-user:first .user');

      expect(ui.find('#spotlight-message-button').hasClass('hidden')).toBe(
        true,
      );
    });

    it('hides the action on an event card, which is not a user message', () => {
      const { ui, output } = setup();

      clickUsername(output, '.msg-subscription .user');

      expect(ui.find('#spotlight-message-button').hasClass('hidden')).toBe(
        true,
      );
    });

    // The `hidden` class is only defined scoped to each menu, so it does
    // nothing on a menu that never declared it. When `#user-action-menu`
    // lacked this rule the class was set correctly and the action still
    // offered itself on every message — which no class-presence assertion
    // above can catch, because jsdom never loads the stylesheet.
    it('has a stylesheet rule that makes the hidden class bite', () => {
      const scss = readFileSync(
        resolve(__dirname, '../../css/menus/_user-action-menu.scss'),
        'utf8',
      );

      expect(scss).toMatch(
        /#user-action-menu[\s\S]*\.hidden\s*\{[^}]*display:\s*none/,
      );
    });

    it('hides the action for a user list entry, which has no message', () => {
      const { menu, ui } = setup();
      const list = $('<div id="chat-user-list"></div>').append(USER_ENTRY_HTML);
      $(document.body).append(list);

      const entry = list.find('.user-entry')[0];
      menu.openMenu(
        $.Event('click', { currentTarget: entry, clientX: 10, clientY: 10 }),
        entry.querySelector('.user'),
        $(entry),
      );

      expect(ui.find('#spotlight-message-button').hasClass('hidden')).toBe(
        true,
      );
    });

    it('sends the message that was clicked', () => {
      const { ui, output, source, messages } = setup();

      clickUsername(output, '.msg-user:first .user');
      ui.find('#spotlight-message-button').trigger('click');

      expect(source.send).toHaveBeenCalledWith('SPOTLIGHT', {
        nick: 'destiny',
        messageTimestamp: messages[0].timestamp.valueOf(),
        data: messages[0].message,
      });
    });

    it('labels the action as a removal when the message is already spotlighted', () => {
      const { ui, output } = setup();

      clickUsername(output, '.msg-spotlighted .user');

      expect(ui.find('#spotlight-message-button').text().trim()).toBe(
        'Remove spotlight',
      );
    });

    it('clears an existing spotlight by its key', () => {
      const { ui, output, source } = setup();

      clickUsername(output, '.msg-spotlighted .user');
      ui.find('#spotlight-message-button').trigger('click');

      expect(source.send).toHaveBeenCalledWith('UNSPOTLIGHT', {
        data: 'abc123',
      });
    });

    it('closes the menu either way', () => {
      const { menu, ui, output } = setup();

      clickUsername(output, '.msg-user:first .user');
      ui.find('#spotlight-message-button').trigger('click');

      expect(menu.visible).toBe(false);
    });
  });

  it('reports whether the layout ships its markup', () => {
    const { menu } = setup();

    expect(menu.available).toBe(true);
    expect(
      new ChatUserActionMenu($(), $('<div></div>'), menu.chat).available,
    ).toBe(false);
  });

  it('leaves username clicks alone when the menu markup is absent', () => {
    const output = $(OUTPUT_HTML);
    $(document.body).empty().append(output);
    const outputClick = jest.fn();
    const chat = {
      output,
      userfocus: { toggleElement: jest.fn(), isFocusedOn: () => false },
      menus: new Map(),
    };

    new ChatUserActionMenu($(), $('<div></div>'), chat);
    output.on('click', outputClick);
    clickUsername(output, '.msg-user:first .user');

    expect(outputClick).toHaveBeenCalledTimes(1);
  });
});
