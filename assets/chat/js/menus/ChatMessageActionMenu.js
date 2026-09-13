import ChatMenuFloating from './ChatMenuFloating';

/**
 * Actions that apply to a message rather than to its author.
 *
 * Its trigger is rendered into each message and revealed on hover, so it needs
 * no tracking of its own: it scrolls, wraps and is pruned with the message it
 * belongs to. Which messages carry one, and who gets to see it, is settled in
 * CSS — `ChatUserMessage` renders it, `.chat-mod` reveals it.
 */
export default class ChatMessageActionMenu extends ChatMenuFloating {
  constructor(ui, btn, chat) {
    super(ui, btn, chat);

    /** The message the open menu is acting on. */
    this.message = null;
    this.spotlightKey = null;

    this.spotlightButton = this.ui.find('#spotlight-message-button');

    this.chat.output.on('click', '.message-actions-trigger', (e) =>
      this.openMenu(e),
    );

    // Covers every way the menu closes — its own action, a click elsewhere,
    // escape, or another menu opening over it.
    this.on('hide', () => this.clearSelection());

    this.ui.on('click', '#spotlight-message-button', () =>
      this.toggleSpotlight(),
    );
  }

  /** Whether this layout ships the menu's markup. */
  get available() {
    return this.ui.length > 0;
  }

  openMenu(e) {
    if (!this.available) {
      return undefined;
    }

    this.clearSelection();
    this.message = e.currentTarget.closest('.msg-chat');
    this.message?.classList.add('msg-menu-open');

    this.spotlightKey = this.message?.dataset.spotlightKey ?? null;
    this.spotlightButton.text(
      this.spotlightKey ? 'Remove spotlight' : 'Spotlight message',
    );

    // Shown first so the menu has dimensions to be placed by; the browser
    // paints neither state until this returns, so there is no flicker.
    this.show();
    this.positionUnder(e.currentTarget);
    return false;
  }

  /** Drops the mark identifying the message the menu was opened for. */
  clearSelection() {
    this.message?.classList.remove('msg-menu-open');
  }

  /**
   * Removing a spotlight clears the message's emphasis only. Its chip in the
   * event bar is a separate record with its own removal action, so it stays
   * until it expires.
   */
  toggleSpotlight() {
    const element = this.message;
    this.hide();

    if (this.spotlightKey) {
      this.chat.source.send('UNSPOTLIGHT', { data: this.spotlightKey });
      return;
    }

    const message = this.chat.mainwindow.messages.find((m) => m.ui === element);
    if (!message?.user) {
      return;
    }

    this.chat.source.send('SPOTLIGHT', {
      nick: message.user.displayName,
      messageTimestamp: message.timestamp.valueOf(),
      // The raw text, so the server hashes what the author actually sent —
      // a leading `/me`, emote codes and all.
      data: message.message,
    });
  }
}
