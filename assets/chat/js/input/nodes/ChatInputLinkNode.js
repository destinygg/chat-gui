import ChatInputNode from './ChatInputNode';

export default class ChatInputLinkNode extends ChatInputNode {
  constructor(input, element, value) {
    super(input, element, 'link', value);
  }

  isValid() {
    const embed = this.input.embedregex.test(this.value);
    const url = this.input.urlregex.test(this.value);
    return embed || url;
  }

  render() {
    this.element.toggleClass(
      'nsfl-link',
      /\b(?:NSFL)\b/i.test(this.input.value)
    );
    this.element.toggleClass(
      'nsfw-link',
      /\b(?:NSFW|SPOILERS?)\b/i.test(this.input.value) &&
        !/\b(?:NSFL)\b/i.test(this.input.value)
    );
    super.render();
  }
}
