import ChatMessage from './ChatMessage';

export default class ChatEventMessage extends ChatMessage {
  constructor(message, timestamp) {
    super(message, timestamp);
    this.tag = null;
    this.title = '';
    this.slashme = false;
    this.isown = false;
    this.mentioned = [];
  }

  html(chat = null) {
    /** @type HTMLDivElement */
    const eventTemplate = document
      .querySelector('#event-template')
      ?.content.cloneNode(true).firstElementChild;

    if (this.user && this.user.username)
      eventTemplate.dataset.username = this.user.username;
    if (this.mentioned && this.mentioned.length > 0)
      eventTemplate.dataset.mentioned = this.mentioned.join(' ').toLowerCase();
    if (this.slashme) eventTemplate.classList.add('msg-me');

    if (this.message) {
      eventTemplate.querySelector('.event-bottom').innerHTML =
        this.buildMessageTxt(chat);
    } else {
      eventTemplate.querySelector('.event-bottom').remove();
    }

    return eventTemplate;
  }

  updateTimeFormat() {
    // This avoids errors. Timestamps aren't rendered in event messages.
  }
}
