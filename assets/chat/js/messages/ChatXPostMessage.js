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

    /** @type HTMLAnchorElement */
    const link = document
      .querySelector('#user-template')
      ?.content.cloneNode(true).firstElementChild;
    link.classList.add('non-chat-user');
    link.href = `https://x.com/${this.handle}`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = `@${this.handle}`;

    eventTemplate.querySelector('.event-info').append(link, ' posted on X');

    eventTemplate.querySelector('.event-icon').classList.add('xpost');

    const bottom = eventTemplate.querySelector('.event-bottom');
    if (bottom) {
      const text = document.createElement('span');
      text.className = 'event-bottom-text';
      while (bottom.firstChild) {
        text.append(bottom.firstChild);
      }
      bottom.append(text);

      /** @type HTMLAnchorElement */
      const openButton = document
        .querySelector('#xpost-link-template')
        ?.content.cloneNode(true).firstElementChild;
      openButton.href = this.url;
      bottom.append(openButton);
    }

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
