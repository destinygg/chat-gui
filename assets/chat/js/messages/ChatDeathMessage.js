import ChatUserMessage from './ChatUserMessage';
import MessageTypes from './MessageTypes';

export default class ChatDeathMessage extends ChatUserMessage {
  constructor(message, user, timestamp = null) {
    super(message, user, timestamp);
    this.type = MessageTypes.DEATH;
  }

  html(chat = null) {
    return super.html(chat);
  }
}
