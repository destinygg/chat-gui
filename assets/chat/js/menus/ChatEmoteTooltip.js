import $ from 'jquery';
import ChatMenuFloating from './ChatMenuFloating';

export default class ChatEmoteTooltip extends ChatMenuFloating {
  constructor(ui, btn, chat) {
    super(ui, btn, chat);

    this.ui.emote = this.ui.find('.emote-image');
    this.ui.name = this.ui.find('.emote-info .name');
    this.ui.creator = this.ui.find('.emote-info .creator');
    this.ui.tier = this.ui.find('.emote-info .tier');

    this.chat.output.on('contextmenu', '.msg-chat .text .emote', (e) => {
      const emote = $(e.currentTarget).closest('.emote')[0].innerText;
      const { creator, minimumSubTier } =
        this.chat.emoteService.getEmote(emote) ?? {};

      this.emote = emote;
      this.creator = creator;
      this.tier = minimumSubTier;

      this.position(e);
      this.show();
      return false;
    });

    this.ui.emote.on('click', '.emote', (e) => {
      const value = this.chat.input.val().toString().trim();
      this.chat.input
        .val(
          `${value + (value === '' ? '' : ' ') + e.currentTarget.innerText} `,
        )
        .focus();
    });
  }

  /**
   * @param {string} emote
   */
  set emote(emote) {
    this.ui.name.text(emote);
    this.ui.emote.html(`<div class="emote ${emote}">${emote}</div>`);
  }

  /**
   * @param {string} creator
   */
  set creator(creator) {
    this.ui.creator.text(creator);
    this.ui.creator[creator ? 'show' : 'hide']();
  }

  /**
   * @param {number} minimumSubTier
   */
  set tier(minimumSubTier) {
    this.ui.tier.text(`Tier ${minimumSubTier}`);
    this.ui.tier[minimumSubTier > 0 ? 'show' : 'hide']();
  }
}
