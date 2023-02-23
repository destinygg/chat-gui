import MessageTypes from './MessageTypes';
import ChatUIMessage from './ChatUIMessage';
import ChatMessage from './ChatMessage';
import ChatUserMessage from './ChatUserMessage';
import ChatEmoteMessage from './ChatEmoteMessage';
import PinnedMessage from './PinnedMessage';
import ChatDonationMessage from './ChatDonationMessage';
import ChatSubscriptionMessage from './ChatSubscriptionMessage';

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

  static broadcast(message, timestamp = null) {
    return new ChatMessage(message, timestamp, MessageTypes.BROADCAST);
  }

  static command(message, timestamp = null) {
    return new ChatMessage(message, timestamp, MessageTypes.COMMAND);
  }

  static message(message, user, timestamp = null) {
    return new ChatUserMessage(message, user, timestamp);
  }

  static emote(emote, timestamp, count = 1) {
    return new ChatEmoteMessage(emote, timestamp, count);
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

  static donation(message, user, currency, timestamp = null) {
    return new ChatDonationMessage(message, user, currency, timestamp);
  }

  static subscription(
    message,
    user,
    tier,
    tierLabel,
    timestamp = null,
    details = null
  ) {
    return new ChatSubscriptionMessage(
      message,
      user,
      tier,
      tierLabel,
      timestamp,
      details
    );
  }
}
