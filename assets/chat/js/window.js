import $ from 'jquery';
import { throttle } from 'throttle-debounce';
import ChatScrollPlugin from './scroll';
import EventEmitter from './emitter';
import { MessageTypes } from './messages';

const tagcolors = [
  'green',
  'yellow',
  'orange',
  'purple',
  'blue',
  'sky',
  'lime',
  'pink',
];

class ChatWindow extends EventEmitter {
  constructor(name, type = '', label = '') {
    super();
    this.name = name;
    this.label = label;
    this.maxlines = 0;
    this.linecount = 0;
    this.locks = 0;
    this.scrollplugin = null;
    this.visible = false;
    this.tag = null;
    this.lastmessage = null;
    this.messages = [];
    this.ui = $(
      `<div id="chat-win-${name}" class="chat-output ${type}" style="display: none;">` +
        `<div class="chat-lines"></div>` +
        `<div class="chat-scroll-notify">More messages below</div>` +
        `</div>`,
    );
    this.lines = this.ui.get(0).querySelector('.chat-lines');
  }

  destroy() {
    this.ui.remove();
    this.scrollplugin.destroy();
    return this;
  }

  into(chat) {
    const normalized = this.name.toLowerCase();
    this.maxlines = chat.settings.get('maxlines');
    this.scrollplugin = new ChatScrollPlugin(
      this.lines,
      this.lines.parentElement,
    );
    this.tag =
      chat.taggednicks.get(normalized) ||
      tagcolors[Math.floor(Math.random() * tagcolors.length)];
    chat.output.append(this.ui);
    chat.addWindow(normalized, this);
    return this;
  }

  show() {
    if (!this.visible) {
      this.visible = true;
      this.emit('show');
      this.ui.show();
    }
  }

  hide() {
    if (this.visible) {
      this.visible = false;
      this.emit('hide');
      this.ui.hide();
    }
  }

  addMessage(chat, message) {
    message.ui = message.html(chat);
    message.afterRender(chat);

    this.lines.append(message.ui);
    this.messages.push(message);
    this.lastmessage = message;

    this.linecount += 1;
    this.cleanupThrottle();
  }

  containsMessage(message) {
    return this.messages.find((msg) => {
      if (msg.type === MessageTypes.EMOTE) {
        return msg.containsMessage(message);
      }
      return msg.md5 === message.md5;
    });
  }

  getlines(sel) {
    return this.lines.querySelectorAll(sel);
  }

  removelines(sel) {
    const remove = this.lines.querySelectorAll(sel);
    this.linecount -= remove.length;
    remove.forEach((element) => {
      element.remove();
    });
  }

  update(forcePin) {
    this.scrollplugin.update(forcePin);
  }

  // Rid excess chat lines if the chat is pinned
  // Get the scroll position before adding the new line / removing old lines
  cleanup() {
    if (this.scrollplugin.wasPinned) {
      const lines = [...this.lines.children];
      if (lines.length >= this.maxlines) {
        const remove = lines.slice(0, lines.length - this.maxlines);
        this.linecount -= remove.length;
        remove.forEach((element) => {
          element.remove();
        });

        this.messages = this.messages.slice(lines.length - this.maxlines);
      }
    }
  }

  isScrollPinned() {
    return this.scrollplugin.pinned;
  }

  scrollBottom() {
    this.scrollplugin.scrollBottom();
  }

  /**
   * Use chat state (settings and authentication data) to update the messages in
   * this window.
   */
  updateMessages(chat) {
    for (const [i, message] of this.messages.entries()) {
      if (message.type !== MessageTypes.UI) {
        message.updateTimeFormat();
      }

      if (message.user?.isSystem()) {
        continue;
      }

      const username = message.user?.username;

      if (
        ![
          MessageTypes.UI,
          MessageTypes.INFO,
          MessageTypes.ERROR,
          MessageTypes.STATUS,
        ].includes(message.type)
      ) {
        message.ignore(chat.ignored(username, message.message));
      }

      if (username) {
        message.setOwnMessage(username === chat.user.username);
        message.highlight(chat.shouldHighlightMessage(message));
        if (message.type === MessageTypes.USER) {
          message.setContinued(this.isContinued(message, this.messages[i - 1]));
          message.setSlashMe(message.slashme);
          message.setTag(chat.taggednicks.get(username));
        }
        message.setTagTitle(chat.taggednotes.get(username) ?? '');
        message.setWatching(chat.user);

        if (message.moderated) {
          message.censor(parseInt(chat.settings.get('showremoved') || '1', 10));
        }
      }
    }
  }

  removeLastMessage() {
    this.lastmessage.remove();
    this.messages = this.messages.filter((m) => m !== this.lastmessage);
  }

  /**
   * @param {ChatMessage} message
   * @param {ChatMessage} lastMessage
   * @returns {boolean}
   */
  isContinued(message, lastMessage = this.lastmessage) {
    return (
      lastMessage &&
      !lastMessage.target &&
      lastMessage.user &&
      (!lastMessage.ignored || lastMessage.continued) && // messages should not appear as "continued" if the previous message is ignored and was the start of the thread
      lastMessage.user.username === message.user.username
    );
  }

  cleanupThrottle = throttle(50, this.cleanup);
}

export default ChatWindow;
