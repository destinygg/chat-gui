import $ from 'jquery';
import ChatMenu from './ChatMenu';

export default class ChatEmoteTooltip extends ChatMenu {
  constructor(ui, btn, chat) {
    super(ui, btn, chat);

    this.emote = this.ui.find('.emote-image');
    this.name = this.ui.find('.emote-info .name');
    this.creator = this.ui.find('.emote-info .creator');

    this.chat.output.on('click', '.msg-user .text .emote', (e) => {
      const emote = $(e.currentTarget).closest('.emote')[0].innerText;

      this.name.text(emote);
      this.setCreator(emote);
      this.emote.html(`<div class="emote ${emote}">${emote}</div>`);

      const rect = this.chat.output[0].getBoundingClientRect();
      // calculating floating window location (if it doesn't fit on screen, adjusting it a bit so it does)
      const x =
        this.ui.width() + e.clientX > rect.width
          ? e.clientX - rect.left + (rect.width - (this.ui.width() + e.clientX))
          : e.clientX - rect.left;
      const y =
        this.ui.height() + e.clientY > rect.height
          ? e.clientY -
            rect.top +
            (rect.height - (this.ui.height() + e.clientY)) -
            12
          : e.clientY - rect.top - 12;

      this.ui[0].style.left = `${x}px`;
      this.ui[0].style.top = `${y}px`;

      super.show();
    });

    this.emote.on('click', '.emote', (e) => {
      const value = this.chat.input.val().toString().trim();
      this.chat.input
        .val(`${value + (value === '' ? '' : ' ') + e.currentTarget.innerText} `)
        .focus();
    });
  }

  setCreator(emote) {
    const emoteData = this.chat.emoteService.getEmote(emote);
    if (emoteData) {
      if (emoteData.creator) {
        this.creator.text(emoteData.creator);
        this.creator.show();
        return;
      }
    }
    this.creator.hide();
  }
}
