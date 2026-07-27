import { usernameColorFlair } from './ChatUserMessage';
import ChatEventMessage from './ChatEventMessage';
import MessageTypes from './MessageTypes';

const DONATION_TIERS = [0, 5, 10, 25, 50, 100];

/**
 * Toggles the correct classes for a specific donation amount.
 * @param {number} amount
 * @returns {array}
 */
export function selectDonationTier(amount) {
  const tier = DONATION_TIERS.findIndex((value) => amount < value * 100);
  return [`amount-${tier !== -1 ? DONATION_TIERS[tier - 1] : '100'}`];
}

export default class ChatDonationMessage extends ChatEventMessage {
  constructor(
    message,
    user,
    amount,
    timestamp,
    expirationTimestamp,
    uuid,
    audio = null,
  ) {
    super(message, timestamp, uuid);
    this.user = user;
    this.type = MessageTypes.DONATION;
    this.amount = amount;
    this.expirationTimestamp = expirationTimestamp;
    // Set when the donation's message is read aloud: the TTS clip URL, which
    // adds a click-to-play button to the event.
    this.audio = audio;

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

    eventTemplate.querySelector('.event-info').append(
      user,
      ` donated ${(this.amount / 100).toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
      })}`,
    );

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
