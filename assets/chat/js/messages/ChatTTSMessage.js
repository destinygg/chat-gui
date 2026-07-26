import { usernameColorFlair } from './ChatUserMessage';
import { selectDonationTier } from './ChatDonationMessage';
import ChatEventMessage from './ChatEventMessage';
import MessageTypes from './MessageTypes';

export default class ChatTTSMessage extends ChatEventMessage {
  constructor(
    message,
    user,
    amount,
    audio,
    timestamp,
    expirationTimestamp,
    uuid,
  ) {
    super(message, timestamp, uuid);
    this.user = user;
    this.type = MessageTypes.TTS;
    this.amount = amount;
    this.audio = audio;
    this.expirationTimestamp = expirationTimestamp;

    this.generateMessageHash();
  }

  html(chat = null) {
    const eventTemplate = super.html(chat);

    /** @type HTMLAnchorElement */
    const user = document
      .querySelector('#user-template')
      ?.content.cloneNode(true).firstElementChild;

    const colorFlair = usernameColorFlair(chat.flairs, this.user);

    user.title = this.title;
    if (colorFlair) {
      user.classList.add(colorFlair.name);
    }
    user.innerText = this.user.displayName;

    // A TTS chat event is only ever a real donation (admin sends don't
    // announce), so it reads exactly like a donation line.
    const suffix = ` donated ${(this.amount / 100).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    })}`;
    eventTemplate.querySelector('.event-info').append(user, suffix);

    const donationTier = selectDonationTier(this.amount);
    eventTemplate.classList.add(donationTier[0]);
    eventTemplate
      .querySelector('.event-icon')
      .classList.add('donation-icon', donationTier[0]);

    const bottom = eventTemplate.querySelector('.event-bottom');
    if (bottom && this.audio) {
      const text = document.createElement('span');
      text.className = 'event-bottom-text';
      while (bottom.firstChild) {
        text.append(bottom.firstChild);
      }
      bottom.append(text);

      /** @type HTMLButtonElement */
      const playButton = document
        .querySelector('#tts-play-template')
        ?.content.cloneNode(true).firstElementChild;
      playButton.dataset.audio = this.audio;
      bottom.append(playButton);
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
