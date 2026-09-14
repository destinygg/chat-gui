// @ts-nocheck

// The scroll plugin pulls in a CSS import that jest can't parse, and this menu
// never uses it in these tests (no `.scrollable` in the fixture). Stub it so the
// import chain stays JS-only.
jest.mock('../scroll', () => ({ __esModule: true, default: class {} }));

import $ from 'jquery';
import ChatMenu from './ChatMenu';
import ChatUserInfoMenu from './ChatUserInfoMenu';
import ChatUser from '../user';
import { MessageBuilder } from '../messages';
import ChatUserMessage from '../messages/ChatUserMessage';

// A minimal `.user-info` subtree containing the subheader rows that
// `renderUserDetails` reads. `.scrollable` is intentionally omitted so the base
// menu skips building a scroll plugin.
const MENU_HTML = `
  <div id="chat-user-info">
    <div class="toolbar"><span></span></div>
    <div class="user-info">
      <h5 class="watching-subheader"></h5>
      <h5 class="date-subheader"></h5>
      <h5 class="age-subheader"></h5>
      <h5 class="gender-subheader"></h5>
      <h5 class="bio-subheader"></h5>
      <h5 class="flairs-subheader"></h5>
      <div class="flairs"></div>
    </div>
  </div>`;

function makeMenu() {
  const ui = $(MENU_HTML);
  const chat = {
    output: { on: () => {} },
    source: { on: () => {} },
    user: { hasModPowers: () => false },
    config: { dggOrigin: 'https://www.destiny.gg' },
    bigscreenPath: '/bigscreen',
    isBigscreenEmbed: () => false,
    isDesktop: false,
    flairsMap: new Map(),
  };
  const menu = new ChatUserInfoMenu(ui, $('<div></div>'), chat);
  return { menu, ui };
}

describe('ChatUserInfoMenu dismissal', () => {
  it('is not closed by an interaction elsewhere', () => {
    const { menu } = makeMenu();
    const chat = { menus: new Map([['user-info', menu]]) };
    menu.show();

    ChatMenu.closeMenus(chat);
    expect(menu.visible).toBe(true);

    // Its own close control still hides it, and so does ESC.
    ChatMenu.closeMenus(chat, { all: true });
    expect(menu.visible).toBe(false);
  });
});

describe('ChatUserInfoMenu.renderUserDetails', () => {
  it('renders age, gender, and bio with mapped labels when set', () => {
    const { menu, ui } = makeMenu();

    menu.renderUserDetails(
      new ChatUser({
        nick: 'Destiny',
        gender: 'nonbinary',
        age: '18-24',
        bio: 'gaming <b>weow</b>',
      }),
      '',
    );

    const age = ui.find('h5.age-subheader')[0];
    const gender = ui.find('h5.gender-subheader')[0];
    const bio = ui.find('h5.bio-subheader')[0];

    expect(age.style.display).toBe('');
    expect(age.textContent).toBe('Age: 18-24');
    expect(gender.style.display).toBe('');
    expect(gender.textContent).toBe('Gender: Nonbinary');
    // Bio is rendered as a text node, so markup is shown literally, not parsed.
    expect(bio.style.display).toBe('');
    expect(bio.textContent).toBe('Bio: gaming <b>weow</b>');
    expect(bio.querySelector('b')).toBeNull();
  });

  it('hides each row when its field is unset', () => {
    const { menu, ui } = makeMenu();

    menu.renderUserDetails(new ChatUser({ nick: 'Blank' }), '');

    expect(ui.find('h5.age-subheader')[0].style.display).toBe('none');
    expect(ui.find('h5.gender-subheader')[0].style.display).toBe('none');
    expect(ui.find('h5.bio-subheader')[0].style.display).toBe('none');
  });

  it('falls back to the raw value for an unknown gender/age', () => {
    const { menu, ui } = makeMenu();

    menu.renderUserDetails(
      new ChatUser({ nick: 'Future', gender: 'agender', age: '65+' }),
      '',
    );

    expect(ui.find('h5.gender-subheader')[0].textContent).toBe(
      'Gender: agender',
    );
    expect(ui.find('h5.age-subheader')[0].textContent).toBe('Age: 65+');
  });
});

describe('ChatUserInfoMenu highlight action', () => {
  const MENU_WITH_ACTIONS = `
    <div id="chat-user-info">
      <div class="toolbar"><span></span></div>
      <div class="actions">
        <div class="action-buttons">
          <a id="highlight-user-btn" class="chat-tool-btn"></a>
        </div>
      </div>
    </div>`;

  const MESSAGE = `
    <div class="msg-chat msg-user" data-username="cake" data-mentioned="destiny">
      <a class="user">Cake</a>
      <span class="text">hey <span class="chat-user">Destiny</span></span>
    </div>`;

  const USER_ENTRY = `
    <div class="user-entry" data-username="destiny">
      <span class="user">Destiny</span>
    </div>`;

  function setup() {
    const ui = $(MENU_WITH_ACTIONS);
    const userfocus = {
      toggleElement: jest.fn(),
      toggleFocus: jest.fn(),
      isFocusedOn: () => false,
    };
    const chat = {
      output: { on: () => {} },
      source: { on: () => {} },
      user: { hasModPowers: () => false },
      userfocus,
    };
    const menu = new ChatUserInfoMenu(ui, $('<div></div>'), chat);

    // Opening the menu for real also loads the user and their history, none of
    // which matters to what the highlight button acts on.
    jest.spyOn(menu, 'setActionsVisibility').mockImplementation(() => {});
    jest.spyOn(menu, 'addContent').mockImplementation(() => {});
    jest.spyOn(menu, 'position').mockImplementation(() => {});
    jest.spyOn(menu, 'show').mockImplementation(() => {});

    return { menu, ui, userfocus };
  }

  // The nick is passed rather than left to `showUser`'s default, which reads
  // `innerText` — jsdom doesn't implement it.
  const openFrom = (menu, element, container, nick) =>
    menu.showUser({ currentTarget: element }, $(container), nick);

  // The regression this guards: highlighting from a mention used to keep the
  // message the mention sits in visible. Focusing the nick alone dimmed it.
  it('highlights through the mention it was opened from', () => {
    const { menu, ui, userfocus } = setup();
    const message = $(MESSAGE);
    const mention = message.find('.chat-user')[0];

    openFrom(menu, mention, message, 'destiny');
    ui.find('#highlight-user-btn').trigger('click');

    expect(userfocus.toggleElement).toHaveBeenCalledWith(mention);
    expect(userfocus.toggleFocus).not.toHaveBeenCalled();
  });

  it("highlights through the author's username it was opened from", () => {
    const { menu, ui, userfocus } = setup();
    const message = $(MESSAGE);
    const author = message.find('.user')[0];

    openFrom(menu, author, message, 'cake');
    ui.find('#highlight-user-btn').trigger('click');

    expect(userfocus.toggleElement).toHaveBeenCalledWith(author);
  });

  // A user list entry has never gone through `toggleElement` — a click on one
  // focused its nick — and it would clear focus rather than set it.
  it('highlights by nick when opened from a user list entry', () => {
    const { menu, ui, userfocus } = setup();
    const entry = $(USER_ENTRY)[0];

    openFrom(menu, entry, entry, 'destiny');
    ui.find('#highlight-user-btn').trigger('click');

    expect(userfocus.toggleFocus).toHaveBeenCalledWith('destiny');
    expect(userfocus.toggleElement).not.toHaveBeenCalled();
  });

  it('forgets the username once opened from something else', () => {
    const { menu, ui, userfocus } = setup();
    const message = $(MESSAGE);
    const entry = $(USER_ENTRY)[0];

    openFrom(menu, message.find('.chat-user')[0], message, 'destiny');
    openFrom(menu, entry, entry, 'destiny');
    ui.find('#highlight-user-btn').trigger('click');

    expect(userfocus.toggleElement).not.toHaveBeenCalled();
    expect(userfocus.toggleFocus).toHaveBeenCalledWith('destiny');
  });
});

describe('ChatUserInfoMenu message history', () => {
  const MENU_WITH_MESSAGES = `
    <div id="chat-user-info">
      <div class="toolbar"><span></span></div>
      <div class="user-info">
        <h5 class="tag-subheader"></h5>
        <div class="content">
          <div class="message-history-status"></div>
          <div class="no-messages-notice"></div>
          <div class="messages"></div>
        </div>
      </div>
    </div>`;

  afterEach(() => jest.restoreAllMocks());

  it("drops a history that lands after another user's menu opened", async () => {
    let resolveHistory;
    const history = new Promise((resolve) => {
      resolveHistory = resolve;
    });
    const chat = {
      output: { on: () => {} },
      source: { on: () => {} },
      user: { hasModPowers: () => false },
      users: new Map(),
      taggednotes: new Map(),
      userInfoService: {
        getUserInfo: async () => ({ nick: 'Cake', features: [] }),
      },
      userMessageService: { getUserMessages: () => history },
    };
    const menu = new ChatUserInfoMenu(
      $(MENU_WITH_MESSAGES),
      $('<div></div>'),
      chat,
    );
    menu.scrollplugin = { scrollBottom: () => {}, reset: () => {} };

    // Rendering a message for real runs every formatter, which needs far more
    // of the chat than this. What matters here is whether it's rendered at all.
    const message = jest
      .spyOn(MessageBuilder, 'message')
      .mockImplementation(() => ({ html: () => '<div></div>' }));
    jest.spyOn(menu, 'renderUserDetails').mockImplementation(() => {});
    jest.spyOn(menu, 'setActionsVisibility').mockImplementation(() => {});

    // Opened from a user list entry, which carries no username for
    // `addContent` to read through `innerText` — jsdom doesn't implement it.
    menu.clickedNick = 'cake';
    menu.addContent($('<div class="user-entry"></div>'));
    menu.clickedNick = 'destiny';
    resolveHistory([{ messageText: 'hey', timestamp: 1000 }]);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(message).not.toHaveBeenCalled();
  });

  // Every message is from the user the menu is titled with, so the name gives
  // way to chat's continuation arrow.
  it('renders each message as a continuation', () => {
    const chat = {
      output: { on: () => {} },
      source: { on: () => {} },
      flairs: [],
      flairsMap: new Map(),
    };
    const menu = new ChatUserInfoMenu(
      $(MENU_WITH_MESSAGES),
      $('<div></div>'),
      chat,
    );
    // The formatters need far more of the chat than this, and the body isn't
    // what's under test.
    jest
      .spyOn(ChatUserMessage.prototype, 'buildMessageTxt')
      .mockReturnValue('<span class="text">hey</span>');

    const element = menu.buildMessageMarkup({
      username: 'Cake',
      messageText: 'hey',
      timestamp: 1000,
    });

    expect(element.classList.contains('msg-continue')).toBe(true);
    expect(element.querySelector('.ctrl').textContent).toBe('');
  });
});

describe('ChatUserInfoMenu redraw', () => {
  it('moves back inside the chat once its content has grown it', () => {
    const chatEl = document.createElement('div');
    const ui = $(`
      <div id="chat-user-info">
        <div class="toolbar"><span></span></div>
      </div>`);
    const menuEl = ui[0];
    chatEl.append(menuEl);

    // jsdom lays nothing out. A 600px-tall chat, and a menu that has grown to
    // 300px while placed 500px down it.
    Object.defineProperties(chatEl, {
      clientWidth: { get: () => 800 },
      clientHeight: { get: () => 600 },
    });
    Object.defineProperties(menuEl, {
      offsetParent: { get: () => chatEl },
      offsetWidth: { get: () => 250 },
      offsetHeight: { get: () => 300 },
      offsetLeft: { get: () => parseInt(menuEl.style.left, 10) || 0 },
      offsetTop: { get: () => parseInt(menuEl.style.top, 10) || 0 },
    });
    menuEl.style.left = '100px';
    menuEl.style.top = '500px';

    const chat = {
      output: { on: () => {} },
      source: { on: () => {} },
    };
    const menu = new ChatUserInfoMenu(ui, $('<div></div>'), chat);
    menu.visible = true;

    menu.redraw();

    expect(menuEl.style.left).toBe('100px');
    expect(menuEl.style.top).toBe('300px');
  });
});
