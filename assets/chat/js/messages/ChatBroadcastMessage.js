import { usernameColorFlair } from './ChatUserMessage';
import ChatEventMessage from './ChatEventMessage';
import MessageTypes from './MessageTypes';

export default class ChatBroadcastMessage extends ChatEventMessage {
  constructor(message, user, uuid, timestamp = null) {
    super(message, timestamp, uuid);
    this.type = MessageTypes.BROADCAST;
    this.user = user;

    this.generateMessageHash();
  }

  buildUserTemplate(chat = null) {
    if (this.user.isSystem()) {
      return [];
    }

    const colorFlair = usernameColorFlair(chat.flairs, this.user);

    /** @type HTMLAnchorElement */
    const user = document
      .querySelector('#user-template')
      ?.content.cloneNode(true).firstElementChild;
    user.title = this.title;
    if (colorFlair) {
      user.classList.add(colorFlair.name);
    }
    user.innerText = this.user.displayName;

    const ctrl = document.createElement('span');
    ctrl.classList.toggle('ctrl');

    if (this.slashme) {
      return [user, ctrl, ' '];
    }

    ctrl.innerText = ': ';

    return [user, ctrl];
  }

  html(chat = null) {
    const eventTemplate = super.html(chat);

    const text = eventTemplate.querySelector('.event-bottom')?.innerHTML;
    eventTemplate.querySelector('.event-bottom').remove();
    eventTemplate.querySelector('.event-info').innerHTML = text;

    const user = this.buildUserTemplate(chat);

    eventTemplate.querySelector('.event-icon').classList.add('broadcast-icon');
    eventTemplate.querySelector('.event-info').prepend(...user);

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
