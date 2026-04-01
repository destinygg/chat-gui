import ChatEventMessage from './ChatEventMessage';
import MessageTypes from './MessageTypes';

export default class ChatBroadcastMessage extends ChatEventMessage {
  constructor(message, user, uuid, timestamp = null) {
    super(message, timestamp, uuid);
    this.type = MessageTypes.BROADCAST;
    this.user = user;

    this.generateMessageHash();
  }

  html(chat = null) {
    const eventTemplate = super.html(chat);

    const info = eventTemplate.querySelector('.event-info');
    const bottom = eventTemplate.querySelector('.event-bottom');
    const bottomText = bottom ? bottom.innerHTML : '';
    if (bottom) {
      bottom.remove();
    }

    info.innerHTML = '';

    const smarterChild = document.createElement('span');
    smarterChild.classList.add('user', 'smarterchild');
    smarterChild.textContent = 'SmarterChild';

    const ctrl = document.createElement('span');
    ctrl.textContent = ': ';

    const text = document.createElement('span');
    text.innerHTML = bottomText;

    info.append(smarterChild, ctrl, text);

    // Remove icon
    const icon = eventTemplate.querySelector('.event-icon');
    if (icon) {
      icon.remove();
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

  get hasActions() {
    return false;
  }
}
