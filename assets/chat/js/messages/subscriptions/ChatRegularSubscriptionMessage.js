import ChatSubscriptionMessage from './ChatSubscriptionMessage';
import MessageTypes from '../MessageTypes';

export default class ChatRegularSubscriptionMessage extends ChatSubscriptionMessage {
  constructor(message, user, tier, tierLabel, streak, timestamp) {
    super(message, user, tier, tierLabel, timestamp);
    this.type = MessageTypes.SUBSCRIPTION;
    this.templateID = '#regular-subscription-template';
    this.streak = streak;
  }

  html(chat = null) {
    const { message, classes, attr } = this.buildBaseSubscription(chat);

    if (!this.streak) {
      message.querySelector('.streak').remove();
    } else {
      message.querySelector('.streak-number').textContent = this.streak;
    }

    return this.wrap(message.firstElementChild.innerHTML, classes, attr);
  }
}
