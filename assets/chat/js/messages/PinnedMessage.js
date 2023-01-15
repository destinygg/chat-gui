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
   * Unpins the current message.
   * @returns {null} null
   */
  unpin() {
    dismissPin(this.uuid);

    this.ui.toggleClass('msg-pinned', false);

    document.getElementById('close-pin-btn')?.remove();
    document.getElementById('unpin-btn')?.remove();

    return null;
  }

  /**
   * Pins the current message.
   * @param {Chat} chat
   * @returns {PinnedMessage} Pinned message.
   */
  pin(chat = null) {
    chat.mainwindow.lock();
    this.ui.toggleClass('msg-pinned', true);
    this.ui.find('span.features').toggleClass('hidden', true);
    chat.mainwindow.unlock();

    if (chat.user.hasModPowers()) {
      const unpinMessage = document.createElement('a');
      const unpinMessageIcon = document.createElement('i');
      unpinMessageIcon.classList.add('btn-icon');
      unpinMessage.append(unpinMessageIcon);

      unpinMessage.setAttribute('id', 'unpin-btn');
      unpinMessage.classList.add('chat-tool-btn');
      unpinMessage.setAttribute('title', 'Unpin Message');

      unpinMessage.addEventListener('click', () => {
        chat.cmdUNPIN();
      });

      this.ui.prepend(unpinMessage);
    }

    const closePin = document.createElement('a');
    const closePinIcon = document.createElement('i');
    closePinIcon.classList.add('btn-icon');
    closePin.append(closePinIcon);

    closePin.setAttribute('id', 'close-pin-btn');
    closePin.classList.add('chat-tool-btn');
    closePin.setAttribute('title', 'Close Pinned Message');

    closePin.addEventListener('click', () => {
      chat.pinnedMessage = this.unpin();
    });

    this.ui.prepend(closePin);

    return this;
  }
}
