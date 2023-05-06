import { usernameColorFlair } from './ChatUserMessage';
import ChatEventMessage from './ChatEventMessage';
import MessageTypes from './MessageTypes';

const DONATION_TIERS = [0, 5, 10, 25, 50, 100];

export default class ChatDonationMessage extends ChatEventMessage {
  constructor(message, user, amount, timestamp) {
    super(message, user, timestamp);
    this.type = MessageTypes.DONATION;
    this.amount = amount;
  }

  /**
   * Toggles the correct classes for a specific donation amount.
   * @param {number} amount
   * @returns {array}
   */
  selectDonationTier(amount) {
    const tier = DONATION_TIERS.findIndex((value) => amount < value * 100);
    return [`amount-${tier !== -1 ? DONATION_TIERS[tier - 1] : '100'}`];
  }

  html(chat = null) {
    const eventTemplate = super.html(chat);

    /** @type HTMLDivElement */
    const donationTemplate = document
      .querySelector('#donation-template')
      ?.content.cloneNode(true);

    const colorFlair = usernameColorFlair(chat.flairs, this.user);

    const user = donationTemplate.querySelector('.user');
    user.title = this.title;
    user.classList.add(colorFlair?.name);
    user.innerText = this.user.username;

    donationTemplate.querySelector('.donation-wrapper span').append(
      ` donated ${(this.amount / 100).toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
      })}`
    );

    const donationTier = this.selectDonationTier(this.amount);
    eventTemplate.classList.add(donationTier[0]);
    donationTemplate
      .querySelector('.donation-icon')
      ?.classList.add(donationTier[0]);

    eventTemplate.querySelector('.event-info')?.append(donationTemplate);

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
