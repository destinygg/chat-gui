import { debounce } from 'throttle-debounce';
import ChatMenu from './ChatMenu';

export default class ChatEmoteMenu extends ChatMenu {
  constructor(ui, btn, chat) {
    super(ui, btn, chat);
    this.searchterm = '';
    this.emoteMenuContent = this.ui.find('.content');
    this.searchinput = this.ui.find(
      '#chat-emote-list-search .form-control:first'
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
        { atBegin: false }
      )
    );
  }

  show() {
    super.show();
    this.searchinput.focus();
    this.buildEmoteMenu();
  }

  buildEmoteMenu() {
    this.emoteMenuContent.empty();

    const tiers = new Set(
      this.chat.emoteService.emotes
        .map((emote) => emote.minimumSubTier)
        .sort((a, b) => a - b)
    );

    tiers.forEach((tier) => {
      const emotes = this.chat.emoteService.emotePrefixesForTier(tier);
      if (!emotes.length) return;

      const title = tier === 0 ? 'All Users' : `Tier ${tier} Subscribers`;
      const locked =
        tier > this.chat.user.subTier && !this.chat.user.isPrivileged();
      this.emoteMenuContent.append(
        this.buildEmoteMenuSection(title, emotes, locked)
      );
    });

    const twitchEmotes = this.chat.emoteService.twitchEmotePrefixes;
    if (twitchEmotes.length) {
      this.emoteMenuContent.append(
        this.buildEmoteMenuSection('Twitch Subscribers', twitchEmotes)
      );
    }
  }

  buildEmoteMenuSection(title, emotes, disabled = false) {
    const emotesStr = emotes
      .map((e) => this.buildEmoteItem(e, disabled))
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

  buildEmoteItem(emote, disabled) {
    if (this.searchterm && this.searchterm.length > 0) {
      if (emote.toLowerCase().indexOf(this.searchterm.toLowerCase()) >= 0) {
        return `<div class="emote-item"><span title="${emote}" class="emote ${emote}${
          disabled ? ' disabled' : ''
        }">${emote}</span></div>`;
      }
      return '';
    }
    return `<div class="emote-item"><span title="${emote}" class="emote ${emote}${
      disabled ? ' disabled' : ''
    }">${emote}</span></div>`;
  }

  selectEmote(emote) {
    const value = this.chat.input.val().toString().trim();
    this.chat.input
      .val(`${value + (value === '' ? '' : ' ') + emote} `)
      .focus();
  }
}
