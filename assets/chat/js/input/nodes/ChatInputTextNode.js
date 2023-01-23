import ChatInputNode from './ChatInputNode';

export default class ChatInputTextNode extends ChatInputNode {
  constructor(input, element, value) {
    super(input, element, 'text', value);
  }
}
