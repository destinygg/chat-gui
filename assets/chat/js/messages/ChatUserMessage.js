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
  }

  html(chat = null) {
    const classes = [];
    const attr = {};

    if (this.id) attr['data-id'] = this.id;
    if (this.user && this.user.username)
      attr['data-username'] = this.user.username.toLowerCase();
    if (this.mentioned && this.mentioned.length > 0)
      attr['data-mentioned'] = this.mentioned.join(' ').toLowerCase();

    if (this.isown) classes.push('msg-own');
    if (this.slashme) classes.push('msg-me');
    if (this.historical) classes.push('msg-historical');
    if (this.highlighted) classes.push('msg-highlight');
    if (this.continued && !this.target) classes.push('msg-continue');
    if (this.tag) classes.push(`msg-tagged msg-tagged-${this.tag}`);
    if (this.target) classes.push(`msg-whisper`);

    let ctrl = ': ';
    if (this.target) ctrl = ' whispered: ';
    else if (this.slashme || this.continued) ctrl = '';

    const user = `${this.buildFeatures(this.user, chat)} <a title="${
      this.title
    }" class="user ${this.user.features.join(' ')}">${this.user.username}</a>`;
    return this.wrap(
      `${this.buildTime()} ${user}<span class="ctrl">${ctrl}</span> ${this.buildMessageTxt(
        chat
      )}`,
      classes,
      attr
    );
  }

  buildFeatures(user, chat) {
    const features = (user.features || [])
      .filter((e) => chat.flairsMap.has(e))
      .map((e) => chat.flairsMap.get(e))
      .reduce(
        (str, e) =>
          `${str}<i data-flair="${e.name}" class="flair ${e.name}" title="${e.label}"></i> `,
        ''
      );
    return features !== '' ? `<span class="features">${features}</span>` : '';
  }
}
