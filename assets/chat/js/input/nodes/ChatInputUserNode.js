import ChatInputNode from './ChatInputNode';

export default class ChatInputUserNode extends ChatInputNode {
  constructor(input, element, username) {
    super(input, element, 'user', username);
  }

  isValid() {
    const username = this.value.startsWith('@')
      ? this.value.substring(1).toLowerCase()
      : this.value.toLowerCase();
    const user = this.input.chat.users.get(username.toLowerCase());
    if (user) return true;
    return false;
  }
}
