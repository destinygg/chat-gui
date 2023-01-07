import ChatStore from '../store';
import ChatUserMessage from './ChatUserMessage';
import MessageTypes from './MessageTypes';

/**
 * @typedef {Object} PINEvent
 * @property {string} uuid Pin's UUID
 * @property {string} data Pin's data
 * @property {string} nick Pin's nick
 * @property {number} timestamp Pin's timestamp
 */

/**
 * @typedef {{
 *   current?: PINEvent;
 *   [uuid: string]: boolean;
 * }} PINStored
 */

export default class PinnedMessage extends ChatUserMessage {
  constructor(message, user, timestamp, uuid) {
    super(message, user, timestamp);
    this.uuid = uuid;
    this.type = MessageTypes.PINNED;

    this.closePinBtn = undefined;
    this.unpinBtn = undefined;

    const pinnedMessageStored = ChatStore.read('chat.pinnedmessage')
      ? ChatStore.read('chat.pinnedmessage')
      : {};
    pinnedMessageStored.current = {
      uuid,
      data: message,
      nick: user.nick.toLowerCase(),
      timestamp: timestamp.valueOf(),
    };
    pinnedMessageStored[`${uuid}`] = false;
    ChatStore.write('chat.pinnedmessage', pinnedMessageStored);
  }

  /**
   * Unpins the current message.
   * @returns {null} null
   */
  unpin() {
    const pinnedMessageStored = ChatStore.read('chat.pinnedmessage');
    pinnedMessageStored[`${this.uuid}`] = true;
    ChatStore.write('chat.pinnedmessage', pinnedMessageStored);

    this.ui.toggleClass('msg-pinned', false);

    this.closePinBtn.remove();
    this.closePinBtn = undefined;

    if (this.unpinBtn !== undefined) {
      this.unpinBtn.remove();
      this.unpinBtn = undefined;
    }

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
        chat.cmdPIN([], true);
      });

      this.unpinBtn = unpinMessage;
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

    this.closePinBtn = closePin;
    this.ui.prepend(closePin);

    return this;
  }
}

/**
 * Checks the received pin against the stored one.
 * @param {PINEvent} msg - Received pin.
 * @param {PINStored} stored - Stored pin.
 * @returns {0 | 1 | 2} Pin condition, where 0 is an empty/"clear" pin, 1 is a new/never dismissed pin and 2 is an old/dismissed pin.
 */
export function checkPin(msg, stored) {
  if (!Object.hasOwn(msg, 'data')) {
    return 0;
  }
  if (stored !== null && Object.hasOwn(stored, msg.uuid)) {
    if (!stored[`${msg.uuid}`]) {
      return 1;
    }
    return 2;
  }
  return 1;
}

/**
 * Removes the current stored pin from the stored pin object.
 * @param {PINStored} stored
 * @returns {PINStored} Cleared stored pin.
 */
export function removeCurrentPin(stored) {
  if (Object.hasOwn(stored, 'current')) {
    const { current, ...clearStored } = stored;
    return clearStored;
  }
  return stored;
}
