import moment from 'moment';
import { debounce } from 'throttle-debounce';
import tippy, { roundArrow } from 'tippy.js';
import ChatMenu from './ChatMenu';

export default class ChatWhisperUsers extends ChatMenu {
  constructor(ui, btn, chat) {
    super(ui, btn, chat);

    this.whisperElements = new Map();
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
    this.chat.source.on('JOIN', (data) => this.updateOnline(data, true));
    this.chat.source.on('QUIT', (data) => this.updateOnline(data, false));
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
    const ui = this.createElement(whisper);
    this.whisperElements.set(whisper.nick.toLowerCase(), { ...whisper, ui });

    const readOrUnreadList = whisper.unread > 0 ? this.unreadEl : this.readEl;
    readOrUnreadList.append(ui);
    readOrUnreadList
      .find('[data-tippy-content]')
      .each(function registerTippy() {
        tippy(this, {
          content: this.getAttribute('data-tippy-content'),
          arrow: roundArrow,
          duration: 0,
          maxWidth: 250,
          hideOnClick: false,
          theme: 'dgg',
        });
      });
  }

  createElement(whisper) {
    const time = moment.utc(whisper.time).local();

    const entry = document.createElement('div');
    entry.classList.add('user-entry');
    entry.classList.add(
      this.chat.users.has(whisper.nick.toLowerCase()) ? 'online' : 'offline',
    );
    if (whisper.found && this.searchterm.length > 0) {
      entry.classList.add('found');
    }
    entry.setAttribute('data-username', whisper.nick.toLowerCase());

    const user = document.createElement('span');
    user.classList.add('user');
    user.textContent = whisper.nick;
    entry.appendChild(user);

    const right = document.createElement('div');
    right.classList.add('right');

    if (whisper.unread > 0) {
      const unread = document.createElement('span');
      unread.classList.add('unread');
      unread.textContent = `${whisper.unread} new`;
      right.appendChild(unread);
    }

    const timeSpan = document.createElement('span');
    timeSpan.classList.add('time');
    timeSpan.setAttribute('data-tippy-content', time.format('LLL'));
    timeSpan.textContent = time.fromNow();
    right.appendChild(timeSpan);

    entry.appendChild(right);

    return entry;
  }

  updateOnline(data, join) {
    if (this.whisperElements.has(data.nick.toLowerCase())) {
      const whisper = this.whisperElements.get(data.nick.toLowerCase());
      whisper.ui.classList.toggle('offline', !join);
      whisper.ui.classList.toggle('online', join);
    }
  }
}
