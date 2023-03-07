import ChatInputNode from './ChatInputNode';

export default class ChatInputUserNode extends ChatInputNode {
  constructor(input, element, value) {
    super(input, element, 'user', value);

    this.element.addClass('user');
  }

  isValid() {
    const username = this.value.startsWith('@')
      ? this.value.substring(1).toLowerCase()
      : this.value.toLowerCase();
    const user = this.input.chat.users.get(username);
    if (user) return true;
    return false;
  }

  render() {
    const colorFlair = this.getUsernameColor();
    this.element.removeClass(
      `noflair ${this.input.chat.flairs.map((flair) => flair.name).join(' ')}`
    );
    this.element.addClass(colorFlair ? colorFlair.name : 'noflair');
    super.render();
  }

  getUsernameColor() {
    const username = this.value.startsWith('@')
      ? this.value.substring(1).toLowerCase()
      : this.value.toLowerCase();
    return this.input.chat.flairs
      .filter((flair) =>
        this.input.chat.users
          .get(username)
          .features.some((feature) => feature === flair.name)
      )
      .sort((a, b) => (a.priority - b.priority >= 0 ? 1 : -1))
      .find((f) => f.rainbowColor || f.color);
  }
}
