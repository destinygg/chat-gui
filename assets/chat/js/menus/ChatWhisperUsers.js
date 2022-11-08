import $ from 'jquery';
import ChatMenu from './ChatMenu';
import ChatUser from '../user';

export default class ChatWhisperUsers extends ChatMenu {
  constructor(ui, btn, chat) {
    super(ui, btn, chat);
    this.unread = 0;
    this.empty = $(`<span class="empty">No new whispers :(</span>`);
    this.notif = $(`<span id="chat-whisper-unread-indicator"></span>`);
    this.btn.append(this.notif);
    this.usersEl = ui.find('ul:first');
    this.usersEl.on('click', '.user', (e) =>
      chat.openConversation(e.target.getAttribute('data-username'))
    );
    this.usersEl.on('click', '.remove', (e) =>
      this.removeConversation(e.target.getAttribute('data-username'))
    );
  }

  removeConversation(nick) {
    const normalized = nick.toLowerCase();
    this.chat.whispers.delete(normalized);
    this.chat.removeWindow(normalized);
    this.redraw();
  }

  updateNotification() {
    const wasunread = this.unread;
    this.unread = [...this.chat.whispers.entries()]
      .map((e) => parseInt(e[1].unread, 10))
      .reduce((a, b) => a + b, 0);
    if (wasunread < this.unread) {
      this.btn.addClass('ping');
      setTimeout(() => this.btn.removeClass('ping'), 2000);
    }
    this.notif.text(this.unread);
    this.notif.toggle(this.unread > 0);
    try {
      // Add the number of unread items to the window title.
      const t = window.parent.document.title.replace(/^\([0-9]+\) /, '');
      window.parent.document.title =
        this.unread > 0 ? `(${this.unread}) ${t}` : `${t}`;
    } catch {} // eslint-disable-line no-empty
  }

  redraw() {
    this.updateNotification(); // its always visible
    if (this.visible) {
      this.usersEl.empty();
      if (this.chat.whispers.size === 0) {
        this.usersEl.append(this.empty);
      } else {
        [...this.chat.whispers.entries()]
          .sort((a, b) => {
            if (a[1].unread === 0) return 1;
            if (b[1].unread === 0) return -1;
            return 0;
          })
          .forEach((e) => this.addConversation(e[0], e[1].unread));
      }
    }
    super.redraw();
  }

  addConversation(nick, unread) {
    const user = this.chat.users.get(nick.toLowerCase()) || new ChatUser(nick);
    this.usersEl.append(`
            <li class="conversation unread-${unread}">
                <a style="flex: 1;" data-username="${user.nick.toLowerCase()}" class="user">${
      user.nick
    }</a>
                <span class="badge">${unread}</span>
                <a data-username="${user.nick.toLowerCase()}" title="Hide" class="remove"></a>
            </li>
        `);
  }
}
