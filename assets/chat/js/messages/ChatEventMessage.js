import ChatMessage from './ChatMessage';

export default class ChatEventMessage extends ChatMessage {
  constructor(message, timestamp, uuid) {
    super(message, timestamp);
    this.tag = null;
    this.title = '';
    this.slashme = false;
    this.isown = false;
    this.mentioned = [];
    this.uuid = uuid;
  }

  html(chat = null) {
    /** @type HTMLDivElement */
    const eventTemplate = document
      .querySelector('#event-template')
      ?.content.cloneNode(true).firstElementChild;

    if (this.user && this.user.username && !this.user.isSystem()) {
      eventTemplate.dataset.username = this.user.username;
    }
    if (this.mentioned && this.mentioned.length > 0) {
      eventTemplate.dataset.mentioned = this.mentioned.join(' ').toLowerCase();
    }
    if (this.slashme) {
      eventTemplate.classList.add('msg-me');
    }

    if (this.message) {
      eventTemplate.querySelector('.event-bottom').innerHTML =
        this.buildMessageTxt(chat);
    } else {
      eventTemplate.querySelector('.event-bottom').remove();
    }

    if (!this.hasActions || !chat.user?.hasModPowers()) {
      const eventButton = eventTemplate.querySelector('.event-button');
      eventButton.disabled = true;
    }

    eventTemplate.dataset.uuid = this.uuid;

    return eventTemplate;
  }

  updateTimeFormat() {
    // This avoids errors. Timestamps aren't rendered in event messages.
  }

  get hasActions() {
    return true;
  }
}
