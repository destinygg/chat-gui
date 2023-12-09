import moment from 'moment';
import ChatUIMessage from './ChatUIMessage';
import MessageTypes from './MessageTypes';
import {
  EmoteFormatter,
  GreenTextFormatter,
  HtmlTextFormatter,
  MentionedUserFormatter,
  UrlFormatter,
  EmbedUrlFormatter,
  BadWordsCensorshipFormatter,
  AmazonAssociatesTagInjector,
  SuspostFormatter,
} from '../formatters';
import { DATE_FORMATS } from '../const';

const formatters = new Map();
formatters.set('html', new HtmlTextFormatter());
formatters.set('amazon', new AmazonAssociatesTagInjector());
formatters.set('url', new UrlFormatter());
formatters.set('emote', new EmoteFormatter());
formatters.set('mentioned', new MentionedUserFormatter());
formatters.set('green', new GreenTextFormatter());
formatters.set('sus', new SuspostFormatter());
formatters.set('embed', new EmbedUrlFormatter());
formatters.set('badwordscensor', new BadWordsCensorshipFormatter());

export default class ChatMessage extends ChatUIMessage {
  constructor(
    message,
    timestamp = null,
    type = MessageTypes.CHAT,
    unformatted = false,
  ) {
    super(message);
    this.user = null;
    this.type = type;
    this.continued = false;
    this.timestamp = timestamp ? moment.utc(timestamp).local() : moment();
    this.unformatted = unformatted;
    this.ignored = false;
    this.censorType = null;
  }

  html(chat = null) {
    const classes = [];
    const attr = {};
    if (this.continued) classes.push('msg-continue');
    return this.wrap(
      `${this.buildTime()} ${this.buildMessageTxt(chat)}`,
      classes,
      attr,
    );
  }

  buildMessageTxt(chat) {
    // TODO we strip off the `/me ` of every message -- must be a better way to do this
    let msg =
      this.message.substring(0, 4).toLowerCase() === '/me '
        ? this.message.substring(4)
        : this.message;
    if (!this.unformatted)
      formatters.forEach((f) => {
        msg = f.format(chat, msg, this);
      });
    return `<span class="text">${msg}</span>`;
  }

  buildTime() {
    const datetime = this.timestamp.format(DATE_FORMATS.FULL);
    const unixtime = this.timestamp.valueOf();
    const label = this.timestamp.format(DATE_FORMATS.TIME);
    return `<time class="time" title="${datetime}" data-unixtimestamp="${unixtime}">${label}</time>`;
  }

  updateTimeFormat() {
    const label = this.timestamp.format(DATE_FORMATS.TIME);
    this.ui.querySelector('time').textContent = label;
  }

  censor(censorType) {
    switch (censorType) {
      case 0: // Remove
        this.ui.classList.remove('censored');
        this.hide();
        break;
      case 1: // Censor
        this.ui.classList.add('censored');
        // Ensure ignored messages aren't unhidden.
        this.hide(this.ignored || false);
        break;
      case 2: // Do nothing
        this.ui.classList.remove('censored');
        this.hide(this.ignored || false);
        break;
      default:
        break;
    }

    this.censorType = censorType;
  }

  ignore(shouldIgnore = true) {
    // Ensure moderated messages remain hidden if they're configured to be
    // removed.
    this.hide(this.censorType === 0 || shouldIgnore);
    this.ignored = shouldIgnore;
  }

  /**
   * Allows for adjusting the message's censorship level when the `showremoved`
   * setting is changed. Otherwise, a message with censor type `2` is
   * indistinguishable from an unmoderated message.
   */
  get moderated() {
    return this.censorType !== null;
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
   * @param {ChatMessage} lastMessage
   */
  setContinued(isContinued) {
    this.ui.classList.toggle('msg-continue', isContinued);
    const ctrl = this.ui.querySelector('.ctrl');
    if (ctrl) ctrl.textContent = isContinued ? '' : ': ';

    this.continued = isContinued;
  }
}
