import ChatEventMessage from './ChatEventMessage';
import MessageTypes from './MessageTypes';

/*

 UPDATE TO TYPESCRIPT

 options {
  infoHtml: string,
  bottomText: string,
  borderColor: 'success' | 'fail' | 'info' | 'css color'
 }

*/

function getBorderColor(color) {
  switch (color) {
    case 'success':
      return '#61bd4f'; // $color-green
    case 'danger':
    case 'fail':
      return '#eb5a46'; // $color-red
    case 'info':
      return '#ffab4a'; // $color-orange
    default:
      return color;
  }
}

export default class ChatGenericEventMessage extends ChatEventMessage {
  constructor(options) {
    super(options.bottomText, options.timestamp);
    this.type = MessageTypes.GENEVENT;
    this.options = options;
  }

  html(chat = null) {
    const eventTemplate = super.html(chat);

    eventTemplate.querySelector('.event-info').innerHTML =
      this.options.infoHtml ?? '';

    const attr = {};
    if (this.options.borderColor) {
      attr.style = `border-color: ${getBorderColor(this.options.borderColor)}`;
    }

    return this.wrap(eventTemplate.innerHTML, [], attr);
  }
}
