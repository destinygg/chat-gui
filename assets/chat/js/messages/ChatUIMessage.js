import $ from 'jquery';
import MessageTypes from './MessageTypes';

export default class ChatUIMessage {
  constructor(message, classes = []) {
    /** @type String */
    this.type = MessageTypes.UI;
    /** @type String */
    this.message = message;
    /** @type Array */
    this.classes = classes;
    /** @type JQuery */
    this.ui = null;
  }

  into(chat, window = null) {
    chat.addMessage(this, window);
    return this;
  }

  wrap(content, classes = [], attr = {}) {
    classes.push(this.classes);
    classes.unshift(`msg-${this.type.toLowerCase()}`);
    classes.unshift(`msg-chat`);
    return $('<div></div>', { ...attr, class: classes.join(' ') }).html(
      content
    )[0].outerHTML;
  }

  // eslint-disable-next-line no-unused-vars
  html(chat = null) {
    return this.wrap(this.message);
  }

  // eslint-disable-next-line no-unused-vars
  afterRender(chat = null) {}
}
