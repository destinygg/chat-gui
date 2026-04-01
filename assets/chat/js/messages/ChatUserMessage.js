import encodeUrl from '../encodeUrl';
import ChatMessage from './ChatMessage';
import MessageTypes from './MessageTypes';

export default class ChatUserMessage extends ChatMessage {
  constructor(message, user, timestamp = null) {
    super(message, timestamp, MessageTypes.USER);
    this.user = user;
    this.id = null;
    this.isown = false;
    this.highlighted = false;
    this.historical = false;
    this.target = null;
    this.tag = null;
    this.title = '';
    this.slashme = false;
    this.mentioned = [];

    this.generateMessageHash();
  }

  html(chat = null) {
    const classes = [];
    const attr = {};

    if (this.id) {
      attr['data-id'] = this.id;
    }
    if (this.user && this.user.username) {
      classes.push(...this.user.features);
      attr['data-username'] = this.user.username;

      if (this.user.watching) {
        this.watching = this.user.watching;
        if (chat.user.equalWatching(this.user.watching)) {
          classes.push('watching-same');
        }
      }
    }
    if (this.mentioned && this.mentioned.length > 0) {
      attr['data-mentioned'] = this.mentioned.join(' ').toLowerCase();
    }

    if (this.isown) {
      classes.push('msg-own');
    }
    if (this.slashme) {
      classes.push('msg-me');
    }
    if (this.historical) {
      classes.push('msg-historical');
    }
    if (this.highlighted) {
      classes.push('msg-highlight');
    }
    if (this.continued && !this.target) {
      classes.push('msg-continue');
    }
    if (this.tag) {
      classes.push(`msg-tagged msg-tagged-${this.tag}`);
    }
    if (this.target) {
      classes.push(`msg-whisper`);
    }

    let ctrl = ': ';
    if (this.target) {
      ctrl = ' whispered: ';
    } else if (this.slashme || this.continued) {
      ctrl = '';
    }

    const user = `<a title="${encodeUrl(
      this.title,
    )}" class="user">${this.user.displayName}</a>`;
    return this.wrap(
      `${this.buildTime()} ${user}<span class="ctrl">${ctrl}</span> ${this.buildMessageTxt(
        chat,
      )}`,
      classes,
      attr,
    );
  }

  setTag(newTag) {
    const previousTag = this.tag;
    if (previousTag) {
      this.ui.classList.remove('msg-tagged', `msg-tagged-${previousTag}`);
    }

    if (newTag) {
      this.ui.classList.add('msg-tagged', `msg-tagged-${newTag}`);
    }

    this.tag = newTag;
  }

  setTagTitle(newTitle) {
    this.ui.querySelector('.user').title = newTitle;
    this.title = newTitle;
  }

  highlight(shouldHighlight = true) {
    this.highlighted = shouldHighlight;
    this.ui.classList.toggle('msg-highlight', shouldHighlight);
  }

  /**
   * @param {boolean} isOwn
   */
  setOwnMessage(isOwn) {
    this.ui.classList.toggle('msg-own', isOwn);
    this.isown = isOwn;
  }

  /**
   * @param {boolean} isSlashMe
   */
  setSlashMe(isSlashMe) {
    this.ui.classList.toggle('msg-me', isSlashMe);
    const ctrl = this.ui.querySelector('.ctrl');
    if (ctrl && !this.target) {
      ctrl.textContent = this.slashme || this.continued ? '' : ': ';
    }

    this.slashme = isSlashMe;
  }
}
