import ChatInputNode from './ChatInputNode';

export default class ChatInputAutocompleteNode extends ChatInputNode {
  constructor(input, element, value) {
    super(input, element, 'autocomplete', value);
  }

  render() {
    const emote = this.input.chat.emoteService.getEmote(this.value, false);
    if (emote) {
      this.element.removeClass('user').addClass('msg-chat');

      super.render(`<span class="emote ${this.value}">${this.value}</span>`);
      return;
    }
    const username = this.value.startsWith('@')
      ? this.value.substring(1).toLowerCase()
      : this.value.toLowerCase();
    if (this.input.chat.users.has(username)) {
      this.element.removeClass('msg-chat').addClass('user');

      const colorFlair = this.input.chat.flairs
        .filter((flair) =>
          this.input.chat.users
            .get(username)
            .features.some((feature) => feature === flair.name)
        )
        .sort((a, b) => (a.priority - b.priority >= 0 ? 1 : -1))
        .find((f) => f.rainbowColor || f.color);

      if (this.element[0].classList.length === 3) {
        const last = this.element[0].classList.item(2);
        this.element[0].classList.remove(last);
      }

      this.element.addClass(colorFlair ? colorFlair.name : 'noflair');

      super.render();
    } else {
      this.element.removeClass('user').removeClass('msg-chat');
      super.render();
    }
  }
}
