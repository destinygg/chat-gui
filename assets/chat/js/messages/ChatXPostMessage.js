import ChatEventMessage from './ChatEventMessage';
import MessageTypes from './MessageTypes';

export default class ChatXPostMessage extends ChatEventMessage {
  constructor(handle, text, url, timestamp, expirationTimestamp, uuid) {
    super(text, timestamp, uuid);
    this.type = MessageTypes.XPOST;
    this.handle = handle;
    this.url = url;
    this.expirationTimestamp = expirationTimestamp;

    this.generateMessageHash();
  }

  get hasActions() {
    return false;
  }

  html(chat = null) {
    const eventTemplate = super.html(chat);

    const link = document.createElement('a');
    link.href = this.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.className = 'user';
    link.textContent = `@${this.handle}`;

    eventTemplate.querySelector('.event-info').append(link, ' posted on X');

    eventTemplate.querySelector('.event-icon').classList.add('xpost');

    const classes = Array.from(eventTemplate.classList);
    const attributes = eventTemplate
      .getAttributeNames()
      .reduce((object, attributeName) => {
        if (attributeName === 'class') {
          return object;
        }
        return {
          ...object,
          [attributeName]: eventTemplate.getAttribute(attributeName),
        };
      }, {});

    return this.wrap(eventTemplate.innerHTML, classes, attributes);
  }
}
