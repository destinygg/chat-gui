import $ from 'jquery';
import ChatMenu from './ChatMenu';
import ChatMenuFloating from './ChatMenuFloating';

/**
 * The dropdown shown when a username is left-clicked in chat.
 *
 * Left-clicking a name used to highlight that user's messages outright, which
 * left the user-info menu behind a right-click — unreachable on touch devices
 * and easy to never discover. Both actions now live behind the gesture people
 * reach for first.
 */
export default class ChatUserActionMenu extends ChatMenuFloating {
  constructor(ui, btn, chat) {
    super(ui, btn, chat);

    /** The `.user` / `.chat-user` element the menu was opened from. */
    this.usernameElement = null;
    /** The `.msg-chat` the clicked username belongs to. */
    this.message = null;
    this.clickedNick = '';

    this.highlightButton = this.ui.find('#highlight-user-button');

    // Layouts without the menu markup (the on-stream overlay, the vote chat)
    // keep the old behavior — the click falls through to `ChatUserFocus`.
    if (this.ui.length) {
      this.chat.output.on(
        'click',
        '.msg-chat .user, .msg-chat .chat-user',
        (e) => this.onUsernameClick(e),
      );
    }

    this.ui.on('click', '#highlight-user-button', () => this.highlightUser());
    this.ui.on('click', '#user-info-button', (e) => this.showUserInfo(e));
  }

  onUsernameClick(e) {
    const username = e.currentTarget;

    // `tier` is a sub-tier label styled to match the sub's username color
    // (which requires the `user` class), and `non-chat-user` marks a user-like
    // reference that isn't a chat user (e.g. an X handle on an XPOST event).
    // Neither one has anything to act on.
    if (
      username.classList.contains('tier') ||
      username.classList.contains('non-chat-user')
    ) {
      return undefined;
    }

    // Clicking the author of a whisper opens the conversation with them (see
    // `chat.js`), so leave that click alone.
    if (username.matches('a.user') && username.closest('.msg-whisper')) {
      return undefined;
    }

    this.openMenu(e);

    // Returning false stops the click reaching `ChatUserFocus`, which is bound
    // directly to the output and would otherwise clear the current highlight.
    // jQuery runs delegated handlers before direct ones, so this wins.
    return false;
  }

  openMenu(e) {
    // Clicking the same name again dismisses the menu.
    const openForSameUsername =
      this.visible && this.usernameElement === e.currentTarget;

    ChatMenu.closeMenus(this.chat);
    if (openForSameUsername) {
      return;
    }

    this.usernameElement = e.currentTarget;
    this.message = $(e.currentTarget).closest('.msg-chat');
    // `textContent` rather than `innerText` so the nick matches the one
    // `ChatUserFocus` keys its highlight rules on.
    this.clickedNick = e.currentTarget.textContent;

    this.highlightButton.text(
      this.chat.userfocus.isFocusedOn(this.clickedNick)
        ? 'Remove highlight'
        : 'Highlight',
    );

    this.position(e);
    this.show();
  }

  highlightUser() {
    // Handing the element over (rather than the nick) keeps the mention-vs-
    // author distinction `ChatUserFocus` makes when `focusmentioned` is off.
    this.chat.userfocus.toggleElement(this.usernameElement);
    this.hide();
  }

  showUserInfo(e) {
    const userInfoMenu = this.chat.menus.get('user-info');
    this.hide();
    userInfoMenu?.showUser(e, this.message, this.clickedNick.toLowerCase());
  }
}
