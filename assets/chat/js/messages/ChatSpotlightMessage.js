import ChatEventMessage from './ChatEventMessage';
import MessageTypes from './MessageTypes';
import { usernameColorFlair } from './ChatUserMessage';
import ChatUser from '../user';

/**
 * The expanded card shown when a spotlight's chip in the event bar is opened.
 *
 * It carries the quoted message rather than pointing at it, because the whole
 * point of opening the chip is that the original has scrolled away — or was
 * never received, for anyone who joined after it was sent.
 */
export default class ChatSpotlightMessage extends ChatEventMessage {
  constructor(text, user, spotlightedBy, timestamp, expirationTimestamp, uuid) {
    super(text, timestamp, uuid);
    this.type = MessageTypes.SPOTLIGHT;
    this.user = user;
    this.spotlightedBy = spotlightedBy;
    this.expirationTimestamp = expirationTimestamp;

    this.generateMessageHash();
  }

  html(chat = null) {
    const eventTemplate = super.html(chat);

    /** @type HTMLAnchorElement */
    const author = document
      .querySelector('#user-template')
      ?.content.cloneNode(true).firstElementChild;

    const colorFlair = usernameColorFlair(chat.flairs, this.user);
    if (colorFlair) {
      author.classList.add(colorFlair.name);
    }
    author.textContent = this.user.displayName;

    eventTemplate
      .querySelector('.event-info')
      .append(author, ` spotlighted by ${this.spotlightedBy}`);

    eventTemplate.querySelector('.event-icon').classList.add('spotlight');

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

/**
 * Builds the author as a `ChatUser` from a spotlight payload.
 *
 * The payload carries the author rather than the moderator, so the chip and the
 * card both color the username by the author's flairs.
 *
 * @param {*} data
 * @returns {ChatUser}
 */
export function spotlightAuthor(data) {
  return new ChatUser(data.user);
}
