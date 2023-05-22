import ChatMessage from './ChatMessage';
import MessageTypes from './MessageTypes';

/**
 * Return the highest priority flair with a color, if one exists. This is the
 * flair whose style should be applied to the user's username.
 */
export function usernameColorFlair(allFlairs, user) {
  return allFlairs
    .filter((flair) =>
      user.features.some((userFlair) => userFlair === flair.name)
    )
    .sort((a, b) => (a.priority - b.priority >= 0 ? 1 : -1))
    .find((f) => f.rainbowColor || f.color);
}

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
    if (this.user && this.user.username) {
      classes.push(...this.user.features);
      attr['data-username'] = this.user.username.toLowerCase();
    }
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

    const colorFlair = usernameColorFlair(chat.flairs, this.user);
    const user = `${this.buildFeatures(this.user, chat)} <a title="${
      this.title
    }" class="user ${colorFlair?.name}">${this.user.username}</a>`;
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

  censor(censorType) {
    // Allows for adjusting the message's censorship level when the
    // `showremoved` setting is changed.
    this.ui.dataset.moderated = true;

    switch (censorType) {
      case 0: // Remove
        this.ui.classList.remove('censored');
        this.hide();
        break;
      case 1: // Censor
        this.ui.classList.add('censored');
        this.hide(false);
        break;
      case 2: // Do nothing
        this.ui.classList.remove('censored');
        this.hide(false);
        break;
      default:
        break;
    }
  }

  get moderated() {
    return this.ui.dataset.moderated;
  }
}
