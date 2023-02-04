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
    unformatted = false
  ) {
    super(message);
    this.user = null;
    this.type = type;
    this.continued = false;
    this.timestamp = timestamp ? moment.utc(timestamp).local() : moment();
    this.unformatted = unformatted;
  }

  html(chat = null) {
    const classes = [];
    const attr = {};
    if (this.continued) classes.push('msg-continue');
    return this.wrap(
      `${this.buildTime()} ${this.buildMessageTxt(chat)}`,
      classes,
      attr
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
}
