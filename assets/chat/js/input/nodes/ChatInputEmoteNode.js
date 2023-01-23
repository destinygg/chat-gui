import ChatInputNode from './ChatInputNode';

export default class ChatInputEmoteNode extends ChatInputNode {
  constructor(input, element, emote) {
    super(input, element, 'emote', emote);
  }

  isValid() {
    // is still emote
  }
}
