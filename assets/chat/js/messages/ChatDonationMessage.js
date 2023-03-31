import ChatUserMessage, { usernameColorFlair } from './ChatUserMessage';
import MessageTypes from './MessageTypes';

const DONATION_TIERS = [0, 5, 10, 25, 50, 100];

export default class ChatDonationMessage extends ChatUserMessage {
  constructor(message, user, amount, timestamp) {
    super(message, user, timestamp);
    this.type = MessageTypes.DONATION;
    this.amount = amount;
    this.mentioned = [];
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
    const attr = {};

    if (this.user && this.user.username)
      attr['data-username'] = this.user.username.toLowerCase();
    if (this.mentioned && this.mentioned.length > 0)
      attr['data-mentioned'] = this.mentioned.join(' ').toLowerCase();

    const colorFlair = usernameColorFlair(chat.flairs, this.user);

    /** @type DocumentFragment */
    const message = document
      .querySelector('#donation-template')
      ?.content.cloneNode(true);

    const user = message.querySelector('.user');
    user.title = this.title;
    user.classList.add(colorFlair?.name);
    user.innerText = this.user.username;

    message.querySelector('.donation-wrapper span').append(
      ` donated ${(this.amount / 100).toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
      })}`
    );

    const classes = this.selectDonationTier(this.amount);

    if (this.message) {
      message.querySelector('.text-wrapper').innerHTML =
        this.buildMessageTxt(chat);
    } else {
      message.querySelector('.text-wrapper').remove();
      classes.push('no-message');
    }

    message.querySelector('.donation-icon').classList.add(classes[0]);

    return this.wrap(message.firstElementChild.innerHTML, classes, attr);
  }
}
