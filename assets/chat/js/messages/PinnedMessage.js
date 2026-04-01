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
    this.minimized = false;
  }

  /**
   * Shows/hides the current message (minimize/restore).
   * @param {boolean} state
   */
  set displayed(state) {
    this.minimized = !state;
    const body = document.getElementById('pinned-message-body');
    if (body) {
      body.style.display = state ? 'block' : 'none';
    }
    const window = document.querySelector('.pinned-window');
    if (window) {
      window.classList.toggle('minimized', !state);
    }
    const showBtn = document.getElementById('chat-pinned-show-btn');
    if (showBtn) {
      showBtn.classList.toggle('active', !state);
    }
  }

  /**
   * Shows/hides the full pinned message frame.
   * @param {boolean} state
   */
  set hidden(state) {
    const frame = document.getElementById('chat-pinned-message');
    frame.classList.toggle('active', !state);
  }

  /**
   * Unpins the current message.
   * @returns {null} null
   */
  unpin() {
    dismissPin(this.uuid);

    this.hidden = true;
    const frame = document.getElementById('chat-pinned-message');
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
    this.ui.id = 'msg-pinned';
    this.ui.classList.add('msg-pinned');

    // Build the Win95 window
    const window = document.createElement('div');
    window.classList.add('pinned-window');

    // Toolbar (title bar)
    const toolbar = document.createElement('div');
    toolbar.classList.add('toolbar');

    const title = document.createElement('h5');
    const titleSpan = document.createElement('span');
    titleSpan.textContent = 'Your Attention Please';

    const buttonGroup = document.createElement('div');
    buttonGroup.classList.add('pinned-toolbar-buttons');

    // Minimize button (all users)
    const minimizeBtn = document.createElement('button');
    minimizeBtn.classList.add('pinned-nav-btn', 'pinned-minimize-btn');
    minimizeBtn.addEventListener('click', () => {
      this.displayed = this.minimized;
    });
    buttonGroup.appendChild(minimizeBtn);

    // Close button (mods only)
    if (chat.user.hasModPowers()) {
      const closeBtn = document.createElement('button');
      closeBtn.classList.add('pinned-nav-btn', 'pinned-close-btn');
      closeBtn.addEventListener('click', () => {
        chat.cmdUNPIN();
      });
      buttonGroup.appendChild(closeBtn);
    }

    title.appendChild(titleSpan);
    title.appendChild(buttonGroup);
    toolbar.appendChild(title);

    // Message body (AIM chat style)
    const body = document.createElement('div');
    body.id = 'pinned-message-body';

    const messageArea = document.createElement('div');
    messageArea.classList.add('pinned-message-area');

    const senderName = document.createElement('span');
    senderName.classList.add('pinned-sender');
    senderName.textContent = `${this.user.displayName}: `;

    const messageText = document.createElement('span');
    messageText.classList.add('pinned-text');
    messageText.textContent = this.message;

    messageArea.appendChild(senderName);
    messageArea.appendChild(messageText);
    body.appendChild(messageArea);

    window.appendChild(toolbar);
    window.appendChild(body);

    // Show button (when minimized/dismissed)
    const showPin = document.createElement('div');
    showPin.id = 'chat-pinned-show-btn';
    showPin.classList.toggle('active', !visibility);
    showPin.title = 'Show Pinned Message';
    const showPinIcon = document.createElement('i');
    showPinIcon.classList.add('btn-icon');
    showPin.appendChild(showPinIcon);
    showPin.addEventListener('click', () => {
      this.displayed = true;
    });

    if (!visibility) {
      body.style.display = 'none';
    }

    const pinnedFrame = document.getElementById('chat-pinned-message');
    pinnedFrame.classList.toggle('active', true);
    pinnedFrame.replaceChildren();
    pinnedFrame.appendChild(window);
    pinnedFrame.appendChild(showPin);

    chat.mainwindow.update();

    return this;
  }
}
