import ChatStore from '../store';
import ChatUserMessage from './ChatUserMessage';
import MessageTypes from './MessageTypes';

/**
 * @typedef {Object} PINEvent
 * @property {string} uuid
 * @property {string} data Pinned message's text
 * @property {string} nick
 * @property {number} timestamp
 */

/**
 * @typedef {{
 *   [uuid: string]: boolean;
 * }} PINStored
 */

/**
 * Checks if the received pin was dismissed before.
 * @param {string} uuid
 * @returns {boolean}
 */
export function checkIfPinWasDismissed(uuid) {
  return ChatStore.read('chat.pinnedmessage')?.[uuid];
}

/**
 * Sets the pin's status in localStorage as dismissed.
 * @param {string} uuid
 */
function dismissPin(uuid) {
  const pinnedMessageStored = ChatStore.read('chat.pinnedmessage') ?? {};
  pinnedMessageStored[uuid] = true;
  ChatStore.write('chat.pinnedmessage', pinnedMessageStored);
}

export default class PinnedMessage extends ChatUserMessage {
  constructor(message, user, timestamp, uuid) {
    super(message, user, timestamp);
    this.uuid = uuid;
    this.type = MessageTypes.PINNED;
  }

  /**
   * Shows/hides the current message.
   * @param {?boolean} state
   * @returns {null} null
   */
  toggleVisibility(state = null) {
    this.ui.classList.toggle('hidden', !state);
  }

  /**
   * Unpins the current message.
   * @returns {null} null
   */
  unpin() {
    dismissPin(this.uuid);

    const frame = document.getElementById('chat-pinned-frame');
    frame.classList.toggle('active', false);
    frame.replaceChildren();

    return null;
  }

  /**
   * Pins the current message.
   * @param {Chat} chat
   * @param {?boolean} visibility
   * @returns {PinnedMessage} Pinned message.
   */
  pin(chat = null, visibility = true) {
    chat.mainwindow.lock();
    this.ui.id = 'msg-pinned';
    this.ui.classList.toggle('msg-pinned', true);
    this.toggleVisibility(visibility);
    this.ui.querySelector('span.features').classList.toggle('hidden', true);
    chat.mainwindow.unlock();

    if (chat.user.hasModPowers()) {
      const unpinMessage = document.createElement('a');
      const unpinMessageIcon = document.createElement('i');
      unpinMessageIcon.classList.add('btn-icon');
      unpinMessage.append(unpinMessageIcon);

      unpinMessage.id = 'unpin-btn';
      unpinMessage.classList.add('chat-tool-btn');
      unpinMessage.title = 'Unpin Message';

      unpinMessage.addEventListener('click', () => {
        chat.cmdUNPIN();
      });

      this.ui.prepend(unpinMessage);
    }

    const showPin = document.createElement('div');
    const showPinIcon = document.createElement('i');
    showPinIcon.classList.add('btn-icon');
    showPin.append(showPinIcon);

    showPin.id = 'chat-pinned-show-btn';
    showPin.classList.toggle('active', !visibility);
    showPin.title = 'Show Pinned Message';

    showPin.addEventListener('click', () => {
      showPin.classList.toggle('active', false);
      this.toggleVisibility(true);
    });

    const closePin = document.createElement('a');
    const closePinIcon = document.createElement('i');
    closePinIcon.classList.add('btn-icon');
    closePin.append(closePinIcon);

    closePin.id = 'close-pin-btn';
    closePin.classList.add('chat-tool-btn');
    closePin.title = 'Close Pinned Message';

    closePin.addEventListener('click', () => {
      dismissPin(this.uuid);
      showPin.classList.toggle('active', true);
      this.toggleVisibility(false);
    });

    this.ui.prepend(closePin);

    const pinnedFrame = document.getElementById('chat-pinned-frame');
    pinnedFrame.classList.toggle('active', true);
    pinnedFrame.prepend(this.ui);
    pinnedFrame.prepend(showPin);

    return this;
  }
}
