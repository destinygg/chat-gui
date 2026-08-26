import $ from 'jquery';
import ChatMenuFloating from './ChatMenuFloating';

/**
 * The dropdown shown when a username is left-clicked, either in chat or in the
 * user list.
 *
 * Left-clicking a name used to highlight that user's messages outright, which
 * left the user-info menu behind a right-click — unreachable on touch devices
 * and easy to never discover. Both actions now live behind the gesture people
 * reach for first.
 */
export default class ChatUserActionMenu extends ChatMenuFloating {
  constructor(ui, btn, chat) {
    super(ui, btn, chat);

    /** The element the menu was opened from, whose text is the nick. */
    this.usernameElement = null;
    /** What the user info menu reads its content out of. See `openMenu`. */
    this.message = null;
    this.clickedNick = '';

    this.highlightButton = this.ui.find('#highlight-user-button');

    // Layouts without the menu markup (the on-stream overlay, the vote chat)
    // keep the old behavior — the click falls through to `ChatUserFocus`.
    if (this.available) {
      this.chat.output.on(
        'click',
        '.msg-chat .user, .msg-chat .chat-user',
        (e) => this.onUsernameClick(e),
      );
    }

    this.ui.on('click', '#highlight-user-button', () => this.highlightUser());
    this.ui.on('click', '#user-info-button', (e) => this.showUserInfo(e));
  }

  /** Whether this layout ships the menu's markup. */
  get available() {
    return this.ui.length > 0;
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

    this.openMenu(e, e.currentTarget, $(e.currentTarget).closest('.msg-chat'));

    // Returning false stops the click reaching `ChatUserFocus`, which is bound
    // directly to the output and would otherwise clear the current highlight.
    // jQuery runs delegated handlers before direct ones, so this wins.
    return false;
  }

  /**
   * `usernameElement` is the element whose text is the nick — a `.user` link
   * or `.chat-user` mention in chat, the `.user` span of a user list entry.
   * `container` is what the user info menu reads the clicked user's message and
   * flairs out of: the surrounding `.msg-chat`, or the `.user-entry` itself.
   */
  openMenu(e, usernameElement, container) {
    // Clicking the same name again dismisses the menu.
    const openForSameUsername =
      this.visible && this.usernameElement === usernameElement;

    // Close the other menus — but not one the click came from, so opening this
    // off a user list entry leaves the list up behind it.
    this.chat.menus.forEach((menu) => {
      if (!menu.ui[0]?.contains(e.currentTarget)) {
        menu.hide();
      }
    });

    if (openForSameUsername) {
      return;
    }

    this.usernameElement = usernameElement;
    this.message = container;
    // `textContent` rather than `innerText` so the nick matches the one
    // `ChatUserFocus` keys its highlight rules on.
    this.clickedNick = usernameElement.textContent;

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
