import { usernameColorFlair } from './ChatUserMessage';
import ChatEventMessage from './ChatEventMessage';
import MessageTypes from './MessageTypes';

export default class ChatDeathMessage extends ChatEventMessage {
  constructor(message, user, flavorText, timestamp) {
    super(message, timestamp);
    this.user = user;
    this.type = MessageTypes.DEATH;
    this.flavorText = flavorText;
  }

  html(chat = null) {
    const eventTemplate = super.html(chat);

    /** @type HTMLAnchorElement */
    const user = document
      .querySelector('#user-template')
      ?.content.cloneNode(true).firstElementChild;

    const colorFlair = usernameColorFlair(chat.flairs, this.user);

    user.title = this.title;
    user.classList.add(colorFlair?.name);
    user.innerText = this.user.username;

    eventTemplate
      .querySelector('.event-info')
      .append(user, ` ${this.flavorText}!`);

    eventTemplate.querySelector('.event-icon').classList.add('death-icon');

    const classes = Array.from(eventTemplate.classList);
    const attributes = eventTemplate
      .getAttributeNames()
      .reduce((object, attributeName) => {
        if (attributeName === 'class') return object;
        return {
          ...object,
          [attributeName]: eventTemplate.getAttribute(attributeName),
        };
      }, {});

    return this.wrap(eventTemplate.innerHTML, classes, attributes);
  }
}
