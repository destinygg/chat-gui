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
      if (!e.currentTarget.classList.contains('disabled')) {
        ChatMenu.closeMenus(chat);
        this.selectEmote(e.currentTarget.innerText);
      }
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

    this.chat.emoteService.tiers.forEach((tier) => {
      const emotes = this.chat.emoteService.emotePrefixesForTier(tier);
      if (!emotes.length) {
        return;
      }

      const title = tier === 0 ? 'All Users' : `Tier ${tier} Subscribers`;
      const locked =
        tier > this.chat.user.subTier && !this.chat.user.isPrivileged();
      this.emoteMenuContent.append(
        this.buildEmoteMenuSection(title, emotes, favoriteEmotes, locked),
      );
    });

    const twitchEmotes = this.chat.emoteService.twitchEmotePrefixes;
    if (twitchEmotes.length) {
      this.emoteMenuContent.append(
        this.buildEmoteMenuSection('Twitch Subscribers', twitchEmotes),
      );
    }
  }

  buildEmoteMenuSection(title, emotes, favoriteEmotes, disabled = false) {
    let emotesStr = '';
    if (favoriteEmotes.length > 0) {
      emotesStr += favoriteEmotes
        .map((e) => this.buildEmoteItem(e, true, disabled))
        .join('');
    }
    emotesStr += emotes
      .map((e) =>
        !favoriteEmotes.includes(e)
          ? this.buildEmoteItem(e, false, disabled)
          : null,
      )
      .join('');
    if (emotesStr !== '') {
      return `<div>
              <div id="emote-subscribe-note">${
                disabled ? '<i class="lock"></i>' : ''
              }${title}</div>
              <div class="emote-group${
                disabled ? ' disabled' : ''
              }">${emotesStr}</div>
          </div>`;
    }
    return '';
  }

  buildEmoteItem(emote, favorite, disabled) {
    if (this.searchterm && this.searchterm.length > 0) {
      if (emote.toLowerCase().indexOf(this.searchterm.toLowerCase()) >= 0) {
        return `<div class="emote-item${favorite ? ' favorite-emote' : ''}"><span title="${emote}" class="emote ${emote}${
          disabled ? ' disabled' : ''
        }">${emote}</span></div>`;
      }
      return '';
    }
    return `<div class="emote-item${favorite ? ' favorite-emote' : ''}"><span title="${emote}" class="emote ${emote}${
      disabled ? ' disabled' : ''
    }">${emote}</span></div>`;
  }

  selectEmote(emote) {
    const value = this.chat.input.val().toString().trim();
    this.chat.input.val(`${value + (value === '' ? '' : ' ') + emote} `);
    if (this.chat.isDesktop) {
      this.chat.input.focus();
    }
  }
}
