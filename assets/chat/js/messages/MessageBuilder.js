import MessageTypes from './MessageTypes';
import ChatUIMessage from './ChatUIMessage';
import ChatMessage from './ChatMessage';
import ChatUser from '../user';
import ChatUserMessage from './ChatUserMessage';
import ChatEmoteMessage from './ChatEmoteMessage';
import PinnedMessage from './PinnedMessage';
import ChatDonationMessage from './ChatDonationMessage';
import ChatRegularSubscriptionMessage from './subscriptions/ChatRegularSubscriptionMessage';
import ChatGiftedSubscriptionMessage from './subscriptions/ChatGiftedSubscriptionMessage';
import ChatMassSubscriptionMessage from './subscriptions/ChatMassSubscriptionMessage';
import ChatBroadcastMessage from './ChatBroadcastMessage';
import ChatDeathMessage from './ChatDeathMessage';

export default class MessageBuilder {
  static element(message, classes = []) {
    return new ChatUIMessage(message, classes);
  }

  static status(message, timestamp = null) {
    return new ChatMessage(message, timestamp, MessageTypes.STATUS);
  }

  static error(message, timestamp = null) {
    return new ChatMessage(message, timestamp, MessageTypes.ERROR);
  }

  static info(message, timestamp = null) {
    return new ChatMessage(message, timestamp, MessageTypes.INFO);
  }

  static broadcast(message, user, timestamp = null) {
    return new ChatBroadcastMessage(message, user, timestamp);
  }

  static command(message, timestamp = null) {
    return new ChatMessage(message, timestamp, MessageTypes.COMMAND);
  }

  static message(message, user, timestamp = null) {
    return new ChatUserMessage(message, user, timestamp);
  }

  static emote(emote, timestamp, md5List, count = 1) {
    return new ChatEmoteMessage(emote, timestamp, md5List, count);
  }

  static whisper(message, user, target, timestamp = null, id = null) {
    const m = new ChatUserMessage(message, user, timestamp);
    m.id = id;
    m.target = target;
    return m;
  }

  static historical(message, user, timestamp = null) {
    const m = new ChatUserMessage(message, user, timestamp);
    m.historical = true;
    return m;
  }

  static pinned(message, user, timestamp, uuid) {
    return new PinnedMessage(message, user, timestamp, uuid);
  }

  static subscription(data) {
    return new ChatRegularSubscriptionMessage(
      data.data,
      new ChatUser(data.user),
      data.tier,
      data.tierLabel,
      data.amount,
      data.streak,
      data.timestamp,
      data.expirationTimestamp,
      data.uuid,
    );
  }

  static gift(data) {
    return new ChatGiftedSubscriptionMessage(
      data.data,
      new ChatUser(data.user),
      data.tier,
      data.tierLabel,
      data.amount,
      new ChatUser(data.recipient),
      data.fromMassGift,
      data.timestamp,
      data.expirationTimestamp,
      data.uuid,
    );
  }

  static massgift(data) {
    return new ChatMassSubscriptionMessage(
      data.data,
      new ChatUser(data.user),
      data.tier,
      data.tierLabel,
      data.amount,
      data.quantity,
      data.timestamp,
      data.expirationTimestamp,
      data.uuid,
    );
  }

  static donation(data) {
    return new ChatDonationMessage(
      data.data,
      new ChatUser(data.user),
      data.amount,
      data.timestamp,
      data.expirationTimestamp,
      data.uuid,
    );
  }

  static death(message, user, timestamp = null) {
    return new ChatDeathMessage(message, user, timestamp);
  }
}
