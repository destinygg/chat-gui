import ChatInputNode from './ChatInputNode';

export default class ChatInputEmoteNode extends ChatInputNode {
  constructor(input, element, emote) {
    super(input, element, 'emote', emote);

    this.highlighted = false;

    this.element.addClass('msg-chat');
  }

  /**
   * @param {boolean} bool
   */
  set highlight(bool) {
    this.highlighted = bool;
    this.render();
  }

  isValid() {
    const emote = this.input.chat.emoteService.getEmote(this.value, false);
    if (emote) return true;
    return false;
  }

  render() {
    this.element.toggleClass('highlighted', this.highlighted);
    super.render(`<span class="emote ${this.value}">${this.value}</span>`);
  }
}
