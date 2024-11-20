import $ from 'jquery';
import { throttle } from 'throttle-debounce';
import ChatMessage from './ChatMessage';
import MessageTypes from './MessageTypes';
import { EmoteFormatter } from '../formatters';

function ChatEmoteMessageCount(message) {
  if (!message || !message.combo) {
    return;
  }

  let stepClass = 'x2';
  if (message.emotecount >= 50) {
    stepClass = 'x50';
  } else if (message.emotecount >= 30) {
    stepClass = 'x30';
  } else if (message.emotecount >= 20) {
    stepClass = 'x20';
  } else if (message.emotecount >= 10) {
    stepClass = 'x10';
  } else if (message.emotecount >= 5) {
    stepClass = 'x5';
  }

  message.ui.setAttribute('data-combo', message.emotecount);
  message.ui.setAttribute('data-combo-group', stepClass);

  message.combo.attr('class', `chat-combo ${stepClass}`);
  message.combo_count.text(`${message.emotecount}`);
  message.ui.append(
    message.text.detach().get(0),
    message.combo.detach().get(0),
  );
}
const ChatEmoteMessageCountThrottle = throttle(63, ChatEmoteMessageCount);

export default class ChatEmoteMessage extends ChatMessage {
  constructor(emote, timestamp, count = 1) {
    super(emote, timestamp, MessageTypes.EMOTE);
    this.emotecount = count;
    this.emoteFormatter = new EmoteFormatter();
  }

  html(chat = null) {
    this.text = $(
      `<span class="text">${this.emoteFormatter.format(
        chat,
        this.message,
        this,
      )}</span>`,
    );
    this.combo = $(`<span class="chat-combo"></span>`);
    this.combo_count = $(`<i class="count">${this.emotecount}</i>`);
    this.combo_x = $(`<i class="x">X</i>`);
    this.combo_hits = $(`<i class="hit">Hits</i>`);
    this.combo_txt = $(`<i class="combo">C-C-C-COMBO</i>`);
    return this.wrap(this.buildTime());
  }

  afterRender() {
    this.combo.append(
      this.combo_count,
      ' ',
      this.combo_x,
      ' ',
      this.combo_hits,
      ' ',
      this.combo_txt,
    );
    this.ui.append(this.text.get(0), this.combo.get(0));
  }

  incEmoteCount() {
    this.emotecount += 1;
    ChatEmoteMessageCountThrottle(this);
  }

  completeCombo() {
    ChatEmoteMessageCount(this);
    this.combo.attr('class', `${this.combo.attr('class')} combo-complete`);
    this.combo = null;
    this.combo_count = null;
    this.combo_x = null;
    this.combo_hits = null;
    this.combo_txt = null;
  }
}
