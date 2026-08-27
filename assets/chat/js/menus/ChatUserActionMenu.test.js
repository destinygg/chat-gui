// @ts-nocheck

// The scroll plugin pulls in a CSS import that jest can't parse, and this menu
// never uses it (no `.scrollable` in the fixture). Stub it so the import chain
// stays JS-only.
jest.mock('../scroll', () => ({ __esModule: true, default: class {} }));

import $ from 'jquery';
import ChatUserActionMenu from './ChatUserActionMenu';

const MENU_HTML = `
  <div id="user-action-menu" class="chat-menu">
    <div class="chat-menu-inner floating-window">
      <button id="highlight-user-button" class="user-action">Highlight</button>
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
  </div>`;

function setup({ focused = [] } = {}) {
  const ui = $(MENU_HTML);
  const output = $(OUTPUT_HTML);
  $(document.body).empty().append(output).append(ui);

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

  const chat = { output, userfocus, menus: new Map() };
  const menu = new ChatUserActionMenu(ui, $('<div></div>'), chat);
  chat.menus.set('user-info', userInfoMenu);
  chat.menus.set('user-action', menu);

  return { menu, ui, output, userfocus, userInfoMenu };
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
