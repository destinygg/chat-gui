// @ts-nocheck

// The scroll plugin pulls in a CSS import that jest can't parse, and no fixture
// here has a `.scrollable`. Stub it so the import chain stays JS-only.
jest.mock('../scroll', () => ({ __esModule: true, default: class {} }));

import $ from 'jquery';
import ChatMenu from './ChatMenu';

// A menu that only its own close control dismisses, the way the user info
// window does.
class StickyMenu extends ChatMenu {
  get closesOnOutsideInteraction() {
    return false;
  }
}

function setup() {
  const ui = $(
    `<div id="chat">
       <div id="ordinary" class="chat-menu"><i class="chat-menu-close"></i></div>
       <div id="sticky" class="chat-menu"><i class="chat-menu-close"></i></div>
     </div>`,
  );
  $(document.body).empty().append(ui);

  const chat = { menus: new Map() };
  const ordinary = new ChatMenu(ui.find('#ordinary'), $('<div></div>'), chat);
  const sticky = new StickyMenu(ui.find('#sticky'), $('<div></div>'), chat);
  chat.menus.set('ordinary', ordinary);
  chat.menus.set('sticky', sticky);

  ordinary.show();
  sticky.show();

  return { chat, ui, ordinary, sticky };
}

describe('ChatMenu.closeMenus', () => {
  it('leaves a menu that only closes deliberately', () => {
    const { chat, ordinary, sticky } = setup();

    ChatMenu.closeMenus(chat);

    expect(ordinary.visible).toBe(false);
    expect(sticky.visible).toBe(true);
  });

  it('closes everything when asked for all of them', () => {
    const { chat, ordinary, sticky } = setup();

    ChatMenu.closeMenus(chat, { all: true });

    expect(ordinary.visible).toBe(false);
    expect(sticky.visible).toBe(false);
  });

  it('spares the menu the given element belongs to', () => {
    const { chat, ui, ordinary } = setup();
    const inside = $('<button></button>').appendTo(ui.find('#ordinary'))[0];

    ChatMenu.closeMenus(chat, { except: inside });

    expect(ordinary.visible).toBe(true);
  });

  it('still closes the menus the element is not in', () => {
    const { chat, ui, ordinary, sticky } = setup();
    const inside = $('<button></button>').appendTo(ui.find('#sticky'))[0];

    ChatMenu.closeMenus(chat, { all: true, except: inside });

    expect(ordinary.visible).toBe(false);
    expect(sticky.visible).toBe(true);
  });
});

describe('ChatMenu close control', () => {
  it('hides a sticky menu when its own close control is clicked', () => {
    const { ui, sticky } = setup();

    ui.find('#sticky .chat-menu-close').trigger('click');

    expect(sticky.visible).toBe(false);
  });
});
