// @ts-nocheck

// The scroll plugin pulls in a CSS import that jest can't parse, and the menu
// never uses it here (no `.scrollable` in the fixture). Stub it so the import
// chain stays JS-only.
jest.mock('../scroll', () => ({ __esModule: true, default: class {} }));

import $ from 'jquery';
import ChatUserMenu from './ChatUserMenu';

const MENU_HTML = `
  <div id="chat-user-list">
    <div class="toolbar"><h5><span></span></h5></div>
    <div class="content"></div>
    <div id="chat-user-list-search"><input class="form-control" /></div>
  </div>`;

const USER_ENTRY_HTML = `
  <div class="user-entry" data-username="destiny" data-user-id="1">
    <span class="user flair13">Destiny</span>
    <div class="user-actions"><i class="whisper-nick"></i></div>
  </div>`;

function setup({ userInfo } = {}) {
  const ui = $(MENU_HTML);
  $(document.body).empty().append(ui);

  const userfocus = { toggleFocus: jest.fn() };
  const chat = {
    source: { on: () => {} },
    menus: new Map(),
    flairsMap: new Map(),
    isDesktop: false,
    userfocus,
  };
  const menu = new ChatUserMenu(ui, $('<div></div>'), chat);
  if (userInfo) {
    chat.menus.set('user-info', userInfo);
  }

  const entry = $(USER_ENTRY_HTML);
  ui.find('.content:first').append(entry);

  return { menu, ui, entry, userfocus };
}

function clickEntry(entry) {
  entry.trigger($.Event('click', { clientX: 10, clientY: 10 }));
}

describe('ChatUserMenu user entry clicks', () => {
  it('highlights the user on a left click', () => {
    const userInfo = { showUser: jest.fn() };
    const { entry, userfocus } = setup({ userInfo });

    clickEntry(entry);

    expect(userInfo.showUser).not.toHaveBeenCalled();
    expect(userfocus.toggleFocus).toHaveBeenCalledWith('destiny');
  });
});

describe('ChatUserMenu presence', () => {
  function setupList() {
    const ui = $(MENU_HTML);
    $(document.body).empty().append(ui);

    const handlers = {};
    const chat = {
      source: {
        on: (event, fn) => {
          handlers[event] = fn;
        },
      },
      menus: new Map(),
      flairsMap: new Map(),
      isDesktop: false,
      userfocus: { toggleFocus: jest.fn() },
    };
    new ChatUserMenu(ui, $('<div></div>'), chat);

    const entries = () =>
      [...ui.find('.user-entry')].map(
        (el) =>
          `${el.closest('.section').dataset.section}: ${el.dataset.username}`,
      );
    return { handlers, entries };
  }

  const viewer = { id: 7, nick: 'Viewer', features: [], roles: ['user'] };
  const subscribed = { ...viewer, features: ['flair13'] };

  it('moves a user to their new section on UPDATEUSER', () => {
    const { handlers, entries } = setupList();

    handlers.JOIN(viewer);
    handlers.UPDATEUSER(subscribed);

    expect(entries()).toEqual(['Subscriber Tier 1: viewer']);
  });

  it('removes a user who leaves after changing section', () => {
    const { handlers, entries } = setupList();

    handlers.JOIN(viewer);
    handlers.UPDATEUSER(subscribed);
    handlers.QUIT(subscribed);

    expect(entries()).toEqual([]);
  });

  it('removes a user whose QUIT carries features from another section', () => {
    const { handlers, entries } = setupList();

    handlers.JOIN(viewer);
    handlers.USERSDELTA({ removed: [subscribed] });

    expect(entries()).toEqual([]);
  });
});
