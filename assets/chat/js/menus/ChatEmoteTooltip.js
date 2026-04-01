import $ from 'jquery';
import ChatMenuFloating from './ChatMenuFloating';

export default class ChatEmoteTooltip extends ChatMenuFloating {
  constructor(ui, btn, chat) {
    super(ui, btn, chat);

    this.ui.emote = this.ui.find('.emote-image');
    this.ui.name = this.ui.find('.emote-info .name');
    this.ui.creator = this.ui.find('.emote-info .creator');
    this.ui.favorite = this.ui.find('.emote-info .favorite');

    this.chat.menus.get('emotes').ui.on('click', () => this.hide());

    this.ui.emote.on('click', '.emote', () => {
      const value = this.chat.input.val().toString().trim();
      this.chat.input.val(`${value + (value === '' ? '' : ' ') + this.emote} `);
      if (this.chat.isDesktop) {
        this.chat.input.focus();
      }
    });

    this.ui.favorite.on('click', () => {
      const result = this.chat.toggleFavoriteEmote(this.emote);
      this.hide();
      this.favorite = result;
    });
  }

  contextmenu(e) {
    const el = $(e.currentTarget).closest('.emote')[0];
    const emote = el.dataset.prefix || el.innerText;
    const { creator } = this.chat.emoteService.getEmote(emote) ?? {};

    this.emote = emote;
    this.favorite = this.chat.favoriteemotes.has(emote);
    this.creator = creator;

    this.position(e);
    this.show();
  }

  /**
   * @param {boolean} favorited
   */
  set favorite(favorited) {
    this.ui.favorite.toggleClass('favorited', favorited);
    this.ui.favorite.attr(
      'title',
      favorited ? 'Unfavorite emote' : 'Favorite emote',
    );
  }

  get emote() {
    return this.ui.name.text();
  }

  /**
   * @param {string} emote
   */
  set emote(prefix) {
    const emoteData = this.chat.emoteService.getEmote(prefix);
    const name = emoteData ? emoteData.name : prefix;
    this.ui.name.text(prefix);
    this.ui.emote.html(
      `<div class="emote ${name}" data-prefix="${prefix}">${prefix}</div>`,
    );
  }

  /**
   * @param {string} creator
   */
  set creator(creator) {
    this.ui.creator.text(creator);
    this.ui.creator[creator ? 'show' : 'hide']();
  }
}
