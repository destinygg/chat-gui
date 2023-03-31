import ChatSubscriptionMessage from './ChatSubscriptionMessage';
import MessageTypes from '../MessageTypes';

export default class ChatMassSubscriptionMessage extends ChatSubscriptionMessage {
  constructor(message, user, tier, tierLabel, quantity, timestamp) {
    super(message, user, tier, tierLabel, timestamp);
    this.type = MessageTypes.MASSGIFT;
    this.quantity = quantity;
  }

  html(chat = null) {
    const { message, classes, attr } = this.buildBaseSubscription(chat);

    message.querySelector('.quantity').innerText = this.quantity;
    message.querySelector('.subs-or-sub').innerText =
      this.quantity > 1 ? 'subs' : 'sub';

    return this.wrap(message.firstElementChild.innerHTML, classes, attr);
  }
}
