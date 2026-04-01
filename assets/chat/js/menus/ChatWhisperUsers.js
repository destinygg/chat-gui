import $ from 'jquery';
import ChatMenu from './ChatMenu';
import ChatUser from '../user';

export default class ChatWhisperUsers extends ChatMenu {
  constructor(ui, btn, chat) {
    super(ui, btn, chat);
    this.unread = 0;
    this.notif = $(`<span id="chat-whisper-unread-indicator"></span>`);
    this.btn.append(this.notif);
    this.usersEl = ui.find('ul:first');
    this.usersEl.on('click', '.user', (e) =>
      chat.openConversation(e.target.getAttribute('data-username')),
    );
    this.usersEl.on('click', '.remove', (e) =>
      this.removeConversation(e.target.getAttribute('data-username')),
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
      const t = window.parent.document.title.replace(/\([0-9]+\) /, '');
      window.parent.document.title =
        this.unread > 0 ? `(${this.unread}) ${t}` : `${t}`;
    } catch {} // eslint-disable-line no-empty
  }

  redraw() {
    this.updateNotification(); // its always visible
    if (this.visible) {
      this.usersEl.empty();
      const count = this.chat.whispers.size;
      const sectionTitle = count > 0 ? 'Buddies' : 'Offline';

      const section = $(`<li class="whisper-section">
        <p class="whisper-section-title">${sectionTitle} (${count}/${count})</p>
        <div class="whisper-section-users"></div>
      </li>`);

      const usersContainer = section.find('.whisper-section-users');

      if (count > 0) {
        [...this.chat.whispers.entries()]
          .sort((a, b) => {
            if (a[1].unread === 0) {
              return 1;
            }
            if (b[1].unread === 0) {
              return -1;
            }
            return 0;
          })
          .forEach((e) => {
            const nick = e[0];
            const { unread } = e[1];
            const user =
              this.chat.users.get(nick.toLowerCase()) || new ChatUser(nick);
            usersContainer.append(
              `<div class="conversation" data-unread="${unread}">
                <a data-username="${user.username}" class="user">${user.displayName}</a>
              </div>`,
            );
          });
      }

      this.usersEl.append(section);
    }
    super.redraw();
  }

  addConversation() {
    // handled in redraw
  }
}
