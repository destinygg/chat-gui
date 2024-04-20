import moment from 'moment';
import { debounce } from 'throttle-debounce';
import ChatMenu from './ChatMenu';

export default class ChatWhisperUsers extends ChatMenu {
  constructor(ui, btn, chat) {
    super(ui, btn, chat);
    this.unread = 0;
    this.searchterm = '';
    this.notif = this.chat.ui.find('#chat-whisper-unread-indicator');
    this.unreadEl = this.ui.find('.whispers-unread .whispers');
    this.readEl = this.ui.find('.whispers-read .whispers');
    this.searchinput = this.ui.find(
      '#chat-whisper-users-search .form-control:first',
    );
    this.ui.on('click', '.user-entry', (e) =>
      chat.openConversation(e.currentTarget.getAttribute('data-username')),
    );
    this.searchinput.on(
      'keyup',
      debounce(
        100,
        () => {
          this.searchterm = this.searchinput.val();
          this.filter();
          this.redraw();
        },
        { atBegin: false },
      ),
    );
  }

  filter() {
    [...this.chat.whispers.values()].forEach((whisper) => {
      if (
        whisper.nick.toLowerCase().indexOf(this.searchterm.toLowerCase()) >= 0
      ) {
        whisper.found = true;
      } else {
        whisper.found = false;
      }
    });
  }

  removeConversation(nick) {
    const normalized = nick.toLowerCase();
    this.chat.whispers.delete(normalized);
    this.chat.removeWindow(normalized);
    this.redraw();
  }

  updateNotification() {
    const wasunread = this.unread;
    this.unread = [...this.chat.whispers.values()]
      .map((e) => parseInt(e.unread, 10))
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
    this.unreadEl.empty();
    this.readEl.empty();
    if (this.chat.whispers.size > 0) {
      [...this.chat.whispers.values()]
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .forEach((whisper) => this.addConversation(whisper));
    }
    this.ui.toggleClass('search-in', this.searchterm.length > 0);
    super.redraw();
  }

  addConversation(whisper) {
    const time = moment.utc(whisper.time).local();
    const found = whisper.found && this.searchterm.length > 0 ? ' found' : '';
    const online = this.chat.users.has(whisper.nick.toLowerCase())
      ? 'online'
      : 'offline';
    const unread =
      whisper.unread > 0
        ? `<span class="unread">${whisper.unread} new</span>`
        : '';

    (whisper.unread > 0 ? this.unreadEl : this.readEl).append(`
    <div class="user-entry ${online}${found}" title="${online}" data-username="${whisper.nick.toLowerCase()}">
      <span class="user">${whisper.nick}</span>
      <div class="right">
        ${unread}
        <span class="time" title="${time.format(
          'LLL',
        )}">${time.fromNow()}</span>
      </div>
    </div>`);
  }
}
