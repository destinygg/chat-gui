import $ from 'jquery';
import ChatMenuFloating from './ChatMenuFloating';

export default class ChatEmoteTooltip extends ChatMenuFloating {
  constructor(ui, btn, chat) {
    super(ui, btn, chat);

    this.emote = this.ui.find('.emote-image');
    this.name = this.ui.find('.emote-info .name');
    this.creator = this.ui.find('.emote-info .creator');

    this.chat.output.on('contextmenu', '.msg-chat .text .emote', (e) => {
      const emote = $(e.currentTarget).closest('.emote')[0].innerText;

      this.name.text(emote);
      this.setCreator(emote);
      this.emote.html(`<div class="emote ${emote}">${emote}</div>`);

      this.position(e);
      this.show();
      return false;
    });

    this.emote.on('click', '.emote', (e) => {
      const value = this.chat.input.val().toString().trim();
      if (this.chat.emoteService.canUserUseEmote(this.chat.user, value)) {
        this.chat.input
          .val(
            `${value + (value === '' ? '' : ' ') + e.currentTarget.innerText} `
          )
          .focus();
      }
    });
  }

  setCreator(emote) {
    const { creator } = this.chat.emoteService.getEmote(emote) ?? {};
    this.creator.text(creator);
    this.creator[creator ? 'show' : 'hide']();
  }
}
