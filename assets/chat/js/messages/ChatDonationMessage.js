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

    const user = document.createElement('a');
    user.title = this.title;
    user.classList.add('user', colorFlair?.name);
    user.innerText = this.user.username;

    const donation = document.createElement('span');
    donation.append(user);
    donation.append(
      ` donated ${(this.amount / 100).toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
      })}`
    );

    const donationTier = this.selectDonationTier(this.amount);

    const donationWrapper = document.createElement('span');
    donationWrapper.classList.add('donation-wrapper');
    donationWrapper.append(donation);

    const donationIconWrapper = document.createElement('a');
    donationIconWrapper.classList.add('icon-wrapper');
    const donationIcon = document.createElement('i');
    donationIcon.classList.add('donation-icon', donationTier[0]);
    donationIconWrapper.append(donationIcon);

    const donationInfo = document.createElement('div');
    donationInfo.classList.add('donation-info');
    donationInfo.append(donationWrapper);
    donationInfo.append(donationIconWrapper);

    return this.wrap(
      `${
        donationInfo.outerHTML
      }<span class="text-wrapper">${this.buildMessageTxt(chat)}</span>`,
      donationTier,
      attr
    );
  }
}
