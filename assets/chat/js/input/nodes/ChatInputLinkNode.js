import ChatInputNode from './ChatInputNode';

export default class ChatInputLinkNode extends ChatInputNode {
  constructor(input, element, value) {
    super(input, element, 'link', value);
  }

  isValid() {
    // is still link
  }
}
