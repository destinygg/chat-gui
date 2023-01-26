import ChatInputNode from './ChatInputNode';

export default class ChatInputAutocompleteNode extends ChatInputNode {
  constructor(input, element, value) {
    super(input, element, 'autocomplete', value);

    this.emote = false;
  }

  render() {
    if (this.emote) {
      this.element.removeClass('user').addClass('msg-chat');
      super.render(`<span class="emote ${this.value}">${this.value}</span>`);
      return;
    }

    const username = (
      this.value.startsWith('@')
        ? this.value.substring(1).toLowerCase()
        : this.value.toLowerCase()
    ).trim();
    const user = this.input.chat.users.get(username);
    if (user) {
      this.element.removeClass('msg-chat').addClass('user');

      const colorFlair = this.input.chat.flairs
        .filter((flair) =>
          user.features.some((feature) => feature === flair.name)
        )
        .sort((a, b) => (a.priority - b.priority >= 0 ? 1 : -1))
        .find((f) => f.rainbowColor || f.color);

      this.element.removeClass(
        `noflair ${this.input.chat.flairs.map((flair) => flair.name).join(' ')}`
      );

      this.element.addClass(colorFlair ? colorFlair.name : 'noflair');
    } else {
      this.element.removeClass('user msg-chat');
    }

    super.render();
  }
}
