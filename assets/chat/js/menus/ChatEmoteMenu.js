import { debounce } from 'throttle-debounce';
import ChatMenu from './ChatMenu';

export default class ChatEmoteMenu extends ChatMenu {
  constructor(ui, btn, chat) {
    super(ui, btn, chat);
    this.searchterm = '';
    this.emoteMenuContent = this.ui.find('.all .content');
    this.searchinput = this.ui.find(
      '#chat-emote-list-search .form-control:first',
    );
    this.ui.on('click', '.emote', (e) => {
      ChatMenu.closeMenus(chat);
      this.selectEmote(e.currentTarget.innerText);
    });
    this.searchinput.on(
      'keyup',
      debounce(
        100,
        () => {
          this.searchterm = this.searchinput.val();
          this.buildEmoteMenu();
        },
        { atBegin: false },
      ),
    );
  }

  show() {
    super.show();
    if (this.chat.isDesktop) {
      this.searchinput.focus();
    }
    this.buildEmoteMenu();
  }

  buildEmoteMenu() {
    const favoriteEmotes = [...this.chat.favoriteemotes].filter((e) =>
      this.chat.emoteService.hasEmote(e),
    );

    this.emoteMenuContent.empty();

    const emotes = this.chat.emoteService.prefixes;
    if (!emotes.length) {
      return;
    }

    this.emoteMenuContent.append(
      this.buildEmoteMenuSection(emotes, favoriteEmotes),
    );
  }

  buildEmoteMenuSection(emotes, favoriteEmotes) {
    let emotesStr = '';
    if (favoriteEmotes.length > 0) {
      emotesStr += favoriteEmotes
        .map((e) => this.buildEmoteItem(e, true))
        .join('');
    }
    emotesStr += emotes
      .map((e) =>
        !favoriteEmotes.includes(e) ? this.buildEmoteItem(e, false) : null,
      )
      .join('');
    if (emotesStr !== '') {
      return `<div>
              <div class="emote-group">${emotesStr}</div>
          </div>`;
    }
    return '';
  }

  buildEmoteItem(emote, favorite) {
    if (this.searchterm && this.searchterm.length > 0) {
      if (emote.toLowerCase().indexOf(this.searchterm.toLowerCase()) >= 0) {
        return `<div class="emote-item${favorite ? ' favorite-emote' : ''}"><span title="${emote}" class="emote ${emote}">${emote}</span></div>`;
      }
      return '';
    }
    return `<div class="emote-item${favorite ? ' favorite-emote' : ''}"><span title="${emote}" class="emote ${emote}">${emote}</span></div>`;
  }

  selectEmote(emote) {
    const value = this.chat.input.val().toString().trim();
    this.chat.input.val(`${value + (value === '' ? '' : ' ') + emote} `);
    if (this.chat.isDesktop) {
      this.chat.input.focus();
    }
  }
}
