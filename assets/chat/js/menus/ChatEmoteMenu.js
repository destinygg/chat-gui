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
      this.selectEmote(
        e.currentTarget.dataset.prefix || e.currentTarget.innerText,
      );
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

    const { emotes } = this.chat.emoteService;
    if (!emotes.length) {
      return;
    }

    const smileys = emotes.filter((e) => e.name.startsWith('smiley-'));
    const buddyIcons = emotes.filter((e) => e.name.startsWith('buddy-'));

    const smileyNames = new Set(smileys.map((e) => e.prefix));
    const smileysFav = favoriteEmotes.filter((p) => smileyNames.has(p));
    const buddyFav = favoriteEmotes.filter((p) => !smileyNames.has(p));

    const smileysHtml = this.buildEmoteMenuSection(smileys, smileysFav);
    const buddyHtml = this.buildEmoteMenuSection(buddyIcons, buddyFav);

    if (smileysHtml) {
      this.emoteMenuContent.append(
        `<div class="emote-section"><span class="emote-section-title">Smileys</span>${smileysHtml}</div>`,
      );
    }
    if (buddyHtml) {
      this.emoteMenuContent.append(
        `<div class="emote-section"><span class="emote-section-title">Buddy Icons</span>${buddyHtml}</div>`,
      );
    }
  }

  buildEmoteMenuSection(emotes, favoriteEmotes) {
    let emotesStr = '';
    if (favoriteEmotes.length > 0) {
      emotesStr += favoriteEmotes
        .map((prefix) => {
          const emote = this.chat.emoteService.getEmote(prefix);
          return emote ? this.buildEmoteItem(emote, true) : '';
        })
        .join('');
    }
    emotesStr += emotes
      .map((e) =>
        !favoriteEmotes.includes(e.prefix)
          ? this.buildEmoteItem(e, false)
          : null,
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
    const { prefix, name } = emote;
    if (this.searchterm && this.searchterm.length > 0) {
      if (prefix.toLowerCase().indexOf(this.searchterm.toLowerCase()) >= 0) {
        return `<div class="emote-item${favorite ? ' favorite-emote' : ''}"><span title="${prefix}" class="emote ${name}" data-prefix="${prefix}">${prefix}</span></div>`;
      }
      return '';
    }
    return `<div class="emote-item${favorite ? ' favorite-emote' : ''}"><span title="${prefix}" class="emote ${name}" data-prefix="${prefix}">${prefix}</span></div>`;
  }

  selectEmote(emote) {
    const value = this.chat.input.val().toString().trim();
    this.chat.input.val(`${value + (value === '' ? '' : ' ') + emote} `);
    if (this.chat.isDesktop) {
      this.chat.input.focus();
    }
  }
}
