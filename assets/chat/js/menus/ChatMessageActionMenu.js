import $ from 'jquery';
import ChatMenuFloating from './ChatMenuFloating';

/**
 * Actions that apply to a message rather than to its author.
 *
 * The trigger is a single button that follows the pointer down the chat, for
 * two reasons: a message is not guaranteed to render anything clickable of its
 * own — a continued message shows no username at all — and the window holds
 * hundreds of lines, so a button rendered into each one would be that many
 * nodes for an affordance only ever used on one.
 *
 * It is parked in the output frame rather than among the lines, which keeps it
 * out of the window's own pruning and out of the message markup that
 * `setSpotlight` restructures. That means it does not scroll with its message
 * on its own, so it is repositioned as the chat scrolls.
 */
export default class ChatMessageActionMenu extends ChatMenuFloating {
  constructor(ui, btn, chat) {
    super(ui, btn, chat);

    /** The message the trigger is currently sitting on. */
    this.hovered = null;
    /** The message the open menu is acting on. */
    this.message = null;
    this.spotlightKey = null;

    this.spotlightButton = this.ui.find('#spotlight-message-button');

    // Layouts without the menu's markup (the on-stream overlay, the vote chat)
    // get no trigger at all.
    if (!this.available) {
      return;
    }

    this.trigger = $(
      '<button class="message-actions-trigger hidden" aria-label="Message actions" data-tippy-content="Message actions"><i class="btn-icon"></i></button>',
    );
    this.chat.output.append(this.trigger);

    this.chat.output.on('mouseover', '.msg-chat', (e) =>
      this.trackMessage(e.currentTarget),
    );

    // Leaving the output as a whole, rather than each message: the trigger sits
    // over the message it belongs to, so a pointer moving onto it would
    // otherwise read as leaving that message.
    this.chat.output.on('mouseleave', () => this.hideTrigger());

    // Capturing, because the element that actually scrolls is the scroll
    // plugin's viewport rather than the frame this is bound to.
    this.chat.output[0].addEventListener(
      'scroll',
      () => this.positionTrigger(),
      true,
    );

    this.trigger.on('click', () => this.openMenu());
    this.ui.on('click', '#spotlight-message-button', () =>
      this.toggleSpotlight(),
    );
  }

  /** Whether this layout ships the menu's markup. */
  get available() {
    return this.ui.length > 0;
  }

  /**
   * Spotlighting is the only action so far, and it applies to a message
   * somebody actually said — not to an event card, the pinned message, or a
   * whisper.
   */
  actionable(element) {
    return (
      Boolean(element?.classList.contains('msg-user')) &&
      !element.classList.contains('msg-whisper') &&
      Boolean(this.chat.user?.hasModPowers())
    );
  }

  trackMessage(element) {
    if (!this.actionable(element)) {
      this.hideTrigger();
      return;
    }

    this.hovered = element;
    this.trigger.removeClass('hidden');
    this.positionTrigger();
  }

  /**
   * Keeps the trigger on its message as the chat scrolls, and takes it away
   * once that message has scrolled out of the frame or been pruned.
   */
  positionTrigger() {
    if (!this.hovered?.isConnected) {
      this.hideTrigger();
      return;
    }

    const message = this.hovered.getBoundingClientRect();
    const frame = this.chat.output[0].getBoundingClientRect();

    // A frame that has not been laid out has no box to cull against, and
    // comparing against an empty one would hide the trigger every time.
    const scrolledOut =
      frame.height > 0 &&
      (message.bottom <= frame.top || message.top >= frame.bottom);
    if (scrolledOut) {
      this.hideTrigger();
      return;
    }

    this.trigger.css('top', `${message.top - frame.top}px`);
  }

  hideTrigger() {
    this.hovered = null;
    this.trigger.addClass('hidden');
  }

  openMenu() {
    this.message = this.hovered;
    this.spotlightKey = this.message?.dataset.spotlightKey ?? null;
    this.spotlightButton.text(
      this.spotlightKey ? 'Remove spotlight' : 'Spotlight message',
    );

    // Shown first so the menu has dimensions to be placed by; the browser
    // paints neither state until this returns, so there is no flicker.
    this.show();
    this.positionUnder(this.trigger[0]);
    return false;
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
